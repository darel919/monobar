"use client"
import { useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { value: "DateCreated", label: "Date Created" },
  { value: "SortName", label: "Sort Name" },
  { value: "ProductionYear", label: "Production Year" },
  { value: "CommunityRating", label: "Community Rating" },
  { value: "Random", label: "Random" },
  { value: "Runtime", label: "Runtime" },
];

export default function SortControls({ id, sortBy, sortOrder }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    e.target.form.requestSubmit(); // Submit the form on any change
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
          defaultValue={sortBy}
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
          defaultValue={sortOrder}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </form>
  );
}
