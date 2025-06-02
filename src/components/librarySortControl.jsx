"use client"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { setCrossDomainDocumentCookie } from '@/lib/cookieUtils';

const sortOptions = [
  { value: "DateCreated", label: "Date Created" },
  { value: "SortName", label: "Sort Name" },
  { value: "ProductionYear", label: "Production Year" },
  { value: "CommunityRating", label: "Community Rating" },
  // { value: "Random", label: "Random" },
  { value: "Runtime", label: "Runtime" },
];

export default function LibrarySortControl({ id, sortBy, sortOrder }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [currentSortOrder, setCurrentSortOrder] = useState(sortOrder);

  useEffect(() => {
    setCurrentSortBy(sortBy);
    setCurrentSortOrder(sortOrder);
  }, [sortBy, sortOrder]);
  useEffect(() => {
    if (typeof document !== "undefined") {
      setCrossDomainDocumentCookie('librarySortBy', currentSortBy, { path: '/' });
      setCrossDomainDocumentCookie('librarySortOrder', currentSortOrder, { path: '/' });
    }
  }, [currentSortBy, currentSortOrder]);

  const handleSortChange = (newSortBy, newSortOrder) => {
    setCurrentSortBy(newSortBy);
    setCurrentSortOrder(newSortOrder);
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    params.set("sortBy", newSortBy);
    params.set("sortOrder", newSortOrder);
    const paramString = params.toString().replace(/(&?id=[^&]*){2,}/, `&id=${id}`);
    router.replace(`/library?${paramString}`);
  };

  const handleChange = (e) => {
    const form = e.target.form;
    const newSortBy = form.sortBy.value;
    const newSortOrder = form.sortOrder.value;
    handleSortChange(newSortBy, newSortOrder);
  };

  return (
    <form className="flex gap-4" method="get" action="" onChange={handleChange}>
      <input type="hidden" name="id" value={id} />
      <div className="form-control">
        <label className="label">
          <span className="label-text">Sort By:</span>
        </label>
        <select
          className="select select-bordered"
          name="sortBy"
          defaultValue={currentSortBy}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Order:</span>
        </label>
        <select
          className="select select-bordered"
          name="sortOrder"
          defaultValue={currentSortOrder}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </form>
  );
}
