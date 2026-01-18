import { useModalContext } from "@/contexts/modal-context";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Autocomplete } from "@/components/Autocomplete";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchInventoryItemsQuery } from "@/store/inventory-slice";
import {
  useGetStagedItemsByMediaIdQuery,
  useProcessInventoryBalanceMutation,
} from "@/store/inventory-balances-slice";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

interface ProcessedMediaRef {
  mediaId: string;
  imageUrl: string;
}

export function AIPreviewModal() {
  const { modals, closeModal } = useModalContext();
  const modal = modals["ai-preview"];
  const [searchParams, setSearchParams] = useSearchParams();

  // Track if we're programmatically updating the URL to prevent loops
  const isUpdatingUrlRef = useRef(false);

  // Extract data - array of media references with IDs
  const processedMedia: ProcessedMediaRef[] = modal?.data?.processedMedia || [];

  // Get media ID from URL or fall back to initial data
  const urlMediaId = searchParams.get("mediaId");

  // Determine current index based on URL mediaId or startIndex
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (urlMediaId) {
      const index = processedMedia.findIndex((m) => m.mediaId === urlMediaId);
      return index >= 0 ? index : modal?.data?.startIndex || 0;
    }
    return modal?.data?.startIndex || 0;
  });

  // Get current media reference
  const currentMediaRef = processedMedia[currentIndex];

  // Sync URL when currentIndex changes (from user navigation)
  useEffect(() => {
    if (currentMediaRef?.mediaId && modal?.isOpen) {
      isUpdatingUrlRef.current = true;
      setSearchParams({ mediaId: currentMediaRef.mediaId }, { replace: true });
      // Reset flag after a short delay to allow URL update to complete
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 0);
    }
  }, [currentIndex, currentMediaRef?.mediaId, modal?.isOpen, setSearchParams]);

  // Handle URL changes from browser back/forward (only if not programmatic)
  useEffect(() => {
    if (isUpdatingUrlRef.current) return; // Skip if we're the ones updating the URL

    if (urlMediaId && processedMedia.length > 0) {
      const index = processedMedia.findIndex((m) => m.mediaId === urlMediaId);
      if (index >= 0 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }, [urlMediaId, processedMedia]);

  // Clear URL params when modal is closed
  useEffect(() => {
    if (!modal?.isOpen && urlMediaId) {
      setSearchParams({}, { replace: true });
    }
  }, [modal?.isOpen, urlMediaId, setSearchParams]);

  // Fetch staged items for current media ID
  const {
    data: stagedResponse,
    isLoading: isLoadingStaged,
    isFetching,
  } = useGetStagedItemsByMediaIdQuery(currentMediaRef?.mediaId || "", {
    skip: !currentMediaRef?.mediaId,
  });

  const currentItems = stagedResponse?.data?.items || [];

  // Mutation for reprocessing
  const [processInventoryBalance, { isLoading: isReprocessing }] =
    useProcessInventoryBalanceMutation();

  // State to track edited values for ALL images (persisted across navigation)
  const [allEdits, setAllEdits] = useState<
    Record<string, Record<number, string>>
  >({});

  // Get edits for current media
  const currentEdits = currentMediaRef?.mediaId
    ? allEdits[currentMediaRef.mediaId] || {}
    : {};

  // State to track selected values for current image items
  const [itemSelections, setItemSelections] = useState<Record<number, string>>(
    {}
  );

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

  // Compute values needed for hooks before early return
  const hasMultipleImages = processedMedia.length > 1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < processedMedia.length - 1;

  // Detect if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!currentMediaRef?.mediaId) return false;

    const savedEdits = allEdits[currentMediaRef.mediaId] || {};

    // Check if any current selection differs from the saved state
    return currentItems.some((item, index) => {
      const currentValue = itemSelections[index];
      const savedValue = savedEdits[index] || item.name;
      return currentValue !== savedValue;
    });
  }, [currentMediaRef?.mediaId, itemSelections, allEdits, currentItems]);

  // All hooks must be called before any early returns
  const handleSaveEdits = useCallback(() => {
    if (currentMediaRef?.mediaId) {
      // Save current edits
      setAllEdits((prev) => ({
        ...prev,
        [currentMediaRef.mediaId]: itemSelections,
      }));
    }
  }, [currentMediaRef?.mediaId, itemSelections]);

  const handleCancelEdits = useCallback(() => {
    // Reset to original API data
    if (currentMediaRef?.mediaId) {
      const savedEdits = allEdits[currentMediaRef.mediaId] || {};
      const originalSelections = currentItems.reduce(
        (acc, item, index) => ({
          ...acc,
          [index]: savedEdits[index] || item.name,
        }),
        {}
      );
      setItemSelections(originalSelections);
    }
  }, [currentMediaRef?.mediaId, currentItems, allEdits]);

  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      handleSaveEdits();
      setCurrentIndex(currentIndex - 1);
    }
  }, [canGoPrevious, handleSaveEdits, currentIndex]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      handleSaveEdits();
      setCurrentIndex(currentIndex + 1);
    }
  }, [canGoNext, handleSaveEdits, currentIndex]);

  // Regular function handlers (can be defined after hooks but before early return)
  const handleDownloadCurrent = useCallback(() => {
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
  }, [currentMediaRef, currentItems, currentEdits, currentIndex]);

  const handleDownloadAll = useCallback(() => {
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
  }, [processedMedia, allEdits]);

  const handleReprocess = useCallback(async () => {
    if (!currentMediaRef) return;

    try {
      await processInventoryBalance({
        media_id: currentMediaRef.mediaId,
        imageUrl: currentMediaRef.imageUrl,
      }).unwrap();
      // Successfully reprocessed - data will automatically refresh via RTK Query
    } catch (error) {
      console.error("Failed to reprocess image:", error);
      // Optionally show an error toast here
    }
  }, [currentMediaRef, processInventoryBalance]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canGoPrevious) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && canGoNext) {
        handleNext();
      } else if (e.key === "Escape") {
        handleCancelEdits();
        setSearchParams({}, { replace: true });
        closeModal("ai-preview");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canGoPrevious,
    canGoNext,
    handlePrevious,
    handleNext,
    handleCancelEdits,
    closeModal,
    setSearchParams,
  ]);

  // Early return after all hooks
  if (!modal?.isOpen || !modal.data || processedMedia.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Navigation & Close Controls */}
      <div className="absolute top-4 left-4 z-10 md:flex hidden items-center gap-3">
        {hasMultipleImages && (
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg p-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentIndex + 1} / {processedMedia.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!canGoNext}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg p-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleSaveEdits();
              setSearchParams({}, { replace: true });
              closeModal("ai-preview");
            }}
            className="h-7 w-7"
            title="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold">AI Extracted Items</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoadingStaged || isFetching ? (
                    "Loading items..."
                  ) : (
                    <>
                      Found {currentItems.length}{" "}
                      {currentItems.length === 1 ? "item" : "items"} in this
                      image
                    </>
                  )}
                </p>
                {/* Navigation and close button on mobile */}
                <div className="flex items-center gap-2 mt-3 md:hidden">
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={!canGoPrevious}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <span className="text-sm font-medium px-2">
                        {currentIndex + 1} / {processedMedia.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={!canGoNext}
                        className="h-8"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSaveEdits();
                      setSearchParams({}, { replace: true });
                      closeModal("ai-preview");
                    }}
                    className="h-8 ml-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2">
                {hasUnsavedChanges && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdits}
                      disabled={isLoadingStaged || isFetching}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdits}
                      disabled={isLoadingStaged || isFetching}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {isLoadingStaged || isFetching ? (
                <Card className="p-8 text-center shadow-none">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading items...</p>
                </Card>
              ) : currentItems.length === 0 ? (
                <Card className="p-8 text-center shadow-none">
                  <p className="text-muted-foreground">
                    No items were extracted from this image.
                  </p>
                </Card>
              ) : (
                currentItems.map((item, index) => (
                  <Card
                    key={item._id}
                    className="p-4 transition-all shadow-none"
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
                disabled={isLoadingStaged || isFetching || isReprocessing}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleReprocess}
                size="lg"
                className="flex-none"
                title="Reprocess this image with AI"
                disabled={isLoadingStaged || isFetching || isReprocessing}
              >
                {isReprocessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              {hasMultipleImages && (
                <Button
                  variant="outline"
                  onClick={handleDownloadAll}
                  size="lg"
                  className="flex-1"
                  title="Download all edits"
                  disabled={isReprocessing}
                >
                  Download All Edits
                </Button>
              )}
              <Button
                onClick={() => {
                  handleSaveEdits();
                  setSearchParams({}, { replace: true });
                  closeModal("ai-preview");
                }}
                className="flex-1"
                size="lg"
                disabled={isReprocessing}
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
