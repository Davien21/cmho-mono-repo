import { useModalContext } from "@/contexts/modal-context";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Autocomplete } from "@/components/Autocomplete";
import { useState, useMemo } from "react";
import { useSearchInventoryItemsQuery } from "@/store/inventory-slice";
import { useDebounce } from "@/hooks/use-debounce";

export function AIPreviewModal() {
  const { modals, closeModal } = useModalContext();
  const modal = modals["ai-preview"];

  if (!modal?.isOpen || !modal.data) return null;

  const { imageUrl, items } = modal.data;

  // State to track selected values for each item, initialized with item names
  const [itemSelections, setItemSelections] = useState<Record<number, string>>(
    () =>
      items.reduce(
        (acc, item, index) => ({
          ...acc,
          [index]: item.name,
        }),
        {}
      )
  );

  // Track which item is currently being searched
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Debounce the search query
  const searchQuery =
    activeItemIndex !== null ? itemSelections[activeItemIndex] : "";
  const debouncedQuery = useDebounce(searchQuery, 200);

  // Fetch search results (only when query has at least 2 characters)
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

  const handleDownloadJSON = () => {
    const dataToDownload = {
      imageUrl,
      items,
      extractedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-extracted-items-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header with Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => closeModal("ai-preview")}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="h-full w-full flex flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-muted/30">
          <div className="relative w-full h-full max-w-3xl max-h-[80vh]">
            <img
              src={imageUrl}
              alt="Processed balance sheet"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-[500px] lg:w-[600px] border-l bg-background flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">AI Extracted Items</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Found {items.length} {items.length === 1 ? "item" : "items"} in
              the image
            </p>
          </div>

          {/* Items List */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {items.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No items were extracted from this image.
                  </p>
                </Card>
              ) : (
                items.map((item, index) => (
                  <Card key={index} className="p-4">
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
                              // Delay blur to allow click selection
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
                onClick={handleDownloadJSON}
                size="lg"
                className="flex-none"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => closeModal("ai-preview")}
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
