import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationSectionProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const PaginationSection = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}: PaginationSectionProps) => {
  const maxVisiblePages = 5;

  // Calculate the range of pages to show
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Generate array of page numbers to display
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const showStartEllipsis = startPage > 2;
  const showEndEllipsis = endPage < totalPages - 1;
  const showFirstPage = startPage > 1;
  const showLastPage = endPage < totalPages;

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            className={
              !hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>

        {/* First page */}
        {showFirstPage && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              isActive={currentPage === 1}
              className="cursor-pointer"
            >
              1
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Start ellipsis */}
        {showStartEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Visible page numbers */}
        {visiblePages.map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              onClick={() => onPageChange(pageNum)}
              isActive={currentPage === pageNum}
              className="cursor-pointer"
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* End ellipsis */}
        {showEndEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Last page */}
        {showLastPage && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            className={
              !hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
