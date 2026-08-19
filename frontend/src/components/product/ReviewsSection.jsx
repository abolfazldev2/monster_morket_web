import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { unwrapList } from "../../utils/unwrapList";
import Button from "../common/Button";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-lg ${n <= value ? "text-accent-warn" : "text-text-muted"} ${
            onChange ? "cursor-pointer" : "cursor-default"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => api.get("/reviews/", { params: { product: productId } }).then((r) => r.data),
    enabled: !!productId,
  });
  const reviews = unwrapList(raw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/reviews/", { product: productId, rating, comment });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    } finally {
      setSubmitting(false);
    }
  };

  const average =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Reviews</h2>
        {average && (
          <span className="text-sm text-text-secondary">
            {average} / 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? null : reviews.length === 0 ? (
        <p className="text-text-secondary text-sm mb-6">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-bg-surface border border-border-subtle rounded-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{r.username}</span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-text-secondary">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="bg-bg-surface border border-border-subtle rounded-card p-4">
          <p className="text-sm font-medium mb-2">Leave a review</p>
          <Stars value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full mt-3 bg-bg-surfaceAlt border border-border-subtle rounded-lg px-3 py-2 text-sm min-h-20"
          />
          <Button type="submit" disabled={submitting} className="mt-3" variant="secondary">
            Submit Review
          </Button>
        </form>
      ) : (
        <p className="text-sm text-text-muted">Log in to leave a review.</p>
      )}
    </section>
  );
}
