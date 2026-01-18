import { useModalContext } from "@/contexts/modal-context";
import { X, Download, ChevronLeft, ChevronRight, Edit2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Autocomplete } from "@/components/Autocomplete";
import { useState, useMemo, useEffect } from "react";
import { useSearchInventoryItemsQuery } from "@/store/inventory-slice";
import { useGetStagedItemsByMediaIdQuery } from "@/store/inventory-balances-slice";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface ProcessedMediaRef {
  mediaId: string;
  imageUrl: string;
}

export function AIPreviewModal() {
  const { modals, closeModal } = useModalContext();
  const modal = modals["ai-preview"];

  // Extract data - array of media references with IDs
  const processedMedia: ProcessedMediaRef[] = modal?.data?.processedMedia || [];
  const [currentIndex, setCurrentIndex] = useState(modal?.data?.startIndex || 0);

  // Get current media reference
  const currentMediaRef = processedMedia[currentIndex];

  // Fetch staged items for current media ID
  const { data: stagedResponse, isLoading: isLoadingStaged, isFetching } = useGetStagedItemsByMediaIdQuery(
    currentMediaRef?.mediaId || "",
    {
      skip: !currentMediaRef?.mediaId,
    }
  );

  const currentItems = stagedResponse?.data?.items || [];

  // State to track edited values for ALL images (persisted across navigation)
  const [allEdits, setAllEdits] = useState<Record<string, Record<number, string>>>({});

  // Get edits for current media
  const currentEdits = currentMediaRef?.mediaId ? allEdits[currentMediaRef.mediaId] || {} : {};

  // State to track selected values for current image items
  const [itemSelections, setItemSelections] = useState<Record<number, string>>({});

  // Track editing state
  const [isEditing, setIsEditing] = useState(false);

  // Initialize item selections when items change
  useEffect(() => {
    if (currentMediaRef?.mediaId) {
      const savedEdits = allEdits[currentMediaRef.mediaId] || {};
      const selections = currentItems.reduce(
        (acc, item, index) => ({
          ...acc,
          [index]: savedEdits[index] || item.name,
        }),
        {}
      );
      setItemSelections(selections);
    }
  }, [currentMediaRef?.mediaId, currentItems.length]);

  // Track which item is currently being searched
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Debounce the search query
  const searchQuery =
    activeItemIndex !== null ? itemSelections[activeItemIndex] : "";
  const debouncedQuery = useDebounce(searchQuery, 200);

  // Fetch search results
  const { data: searchResponse } = useSearchInventoryItemsQuery(
    debouncedQuery,
    {
      skip: !debouncedQuery || debouncedQuery.length < 2,
    }
  );

  // Convert to autocomplete options format
  const autocompleteOptions = useMemo(() => {
    if (!searchResponse?.data) return [];
    return searchResponse.data.map((item) => ({
      value: item._id,
      label: item.name,
    }));
  }, [searchResponse]);

  if (!modal?.isOpen || !modal.data || processedMedia.length === 0) return null;

  const hasMultipleImages = processedMedia.length > 1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < processedMedia.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      if (isEditing) {
        handleSaveEdits();
      }
      setCurrentIndex(currentIndex - 1);
      setIsEditing(false);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      if (isEditing) {
        handleSaveEdits();
      }
      setCurrentIndex(currentIndex + 1);
      setIsEditing(false);
    }
  };

  const handleSaveEdits = () => {
    if (currentMediaRef?.mediaId) {
      // Save current edits
      setAllEdits(prev => ({
        ...prev,
        [currentMediaRef.mediaId]: itemSelections,
      }));
    }
    setIsEditing(false);
  };

  const handleDownloadCurrent = () => {
    if (!currentMediaRef) return;

    const dataToDownload = {
      mediaId: currentMediaRef.mediaId,
      imageUrl: currentMediaRef.imageUrl,
      items: currentItems.map((item, itemIdx) => ({
        name: currentEdits[itemIdx] || item.name,
        quantity_details: item.quantity_details,
      })),
      extractedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-extracted-${currentIndex + 1}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const dataToDownload = processedMedia.map((mediaRef) => {
      const edits = allEdits[mediaRef.mediaId] || {};
      return {
        mediaId: mediaRef.mediaId,
        imageUrl: mediaRef.imageUrl,
        edits: edits,
      };
    });

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-extracted-batch-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canGoPrevious && !isEditing) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && canGoNext && !isEditing) {
        handleNext();
      } else if (e.key === "Escape") {
        if (isEditing) {
          handleSaveEdits();
        }
        closeModal("ai-preview");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, canGoPrevious, canGoNext, isEditing]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header with Navigation and Close Button */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {/* Navigation Controls */}
        {hasMultipleImages && (
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentIndex + 1} / {processedMedia.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isEditing) {
              handleSaveEdits();
            }
            closeModal("ai-preview");
          }}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background ml-auto"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="h-full w-full flex flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-muted/30 relative">
          {isLoadingStaged || isFetching ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="relative w-full h-full max-w-3xl max-h-[80vh]">
                <img
                  key={currentMediaRef?.imageUrl}
                  src={currentMediaRef?.imageUrl}
                  alt={`Processed balance sheet ${currentIndex + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              {/* Navigation Arrows (on image for mobile) */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background md:hidden",
                      !canGoPrevious && "opacity-50"
                    )}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background md:hidden",
                      !canGoNext && "opacity-50"
                    )}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-[500px] lg:w-[600px] border-l bg-background flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">AI Extracted Items</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoadingStaged || isFetching ? (
                    "Loading items..."
                  ) : (
                    <>
                      Found {currentItems.length}{" "}
                      {currentItems.length === 1 ? "item" : "items"} in
                      this image
                    </>
                  )}
                </p>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdits();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={isLoadingStaged || isFetching}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Items List */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {isLoadingStaged || isFetching ? (
                <Card className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading items...</p>
                </Card>
              ) : currentItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No items were extracted from this image.
                  </p>
                </Card>
              ) : (
                currentItems.map((item, index) => (
                  <Card
                    key={item._id}
                    className={cn(
                      "p-4 transition-all",
                      isEditing && "ring-2 ring-primary/20"
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Number Badge */}
                      <div className="flex-none">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div>
                          {isEditing ? (
                            <Autocomplete
                              options={
                                activeItemIndex === index
                                  ? autocompleteOptions
                                  : []
                              }
                              value={itemSelections[index] ?? item.name}
                              onValueChange={(value) => {
                                setItemSelections((prev) => ({
                                  ...prev,
                                  [index]: value,
                                }));
                              }}
                              onFocus={() => setActiveItemIndex(index)}
                              onBlur={() => {
                                setTimeout(() => setActiveItemIndex(null), 200);
                              }}
                              placeholder={item.name}
                              hideOutsideHoverOrFocus={true}
                            />
                          ) : (
                            <p className="font-medium text-lg">
                              {currentEdits[index] || item.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-foreground/90">
                            {item.quantity_details}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-6 border-t bg-muted/20">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadCurrent}
                size="lg"
                className="flex-none"
                title="Download current as JSON"
                disabled={isLoadingStaged || isFetching}
              >
                <Download className="h-4 w-4" />
              </Button>
              {hasMultipleImages && (
                <Button
                  variant="outline"
                  onClick={handleDownloadAll}
                  size="lg"
                  className="flex-1"
                  title="Download all edits"
                >
                  Download All Edits
                </Button>
              )}
              <Button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdits();
                  }
                  closeModal("ai-preview");
                }}
                className="flex-1"
                size="lg"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
