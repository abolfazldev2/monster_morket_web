import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Link } from "react-router-dom";

import { EmptyState, Skeleton } from "../../components/common/Feedback";
import { wishlistApi } from "../../services/resources";

export default function Wishlist() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.list().then((r) => r.data),
  });

  const handleRemove = async (itemId) => {
    await wishlistApi.removeItem(itemId);
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data?.length) return <EmptyState title="Your wishlist is empty" subtitle="Save products you're interested in." />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {data.map((item) => (
        <div key={item.id} className="bg-bg-surface border border-border-subtle rounded-card p-4">
          <Link to={`/product/${item.product_slug}`} className="font-medium hover:text-accent-primary">
            {item.product_name}
          </Link>
          <p className="tabular-nums text-sm text-text-secondary mt-1">{item.price}</p>
          <button
            onClick={() => handleRemove(item.id)}
            className="text-xs text-text-muted hover:text-accent-danger mt-2"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
