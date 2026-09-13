import { CreateBrandForm } from "@/components/brand/CreateBrandForm";
import { Brand, getBrandsAdmin } from "@/services/brands";

export default async function BrandsPage() {
  const { data: brands } = await getBrandsAdmin();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Brands</h1>
        </div>

        <CreateBrandForm />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Slug
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Logo
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Website
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {brands.map((brand: Brand) => (
                <tr
                  key={brand.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {brand.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {brand.slug || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {brand.logo ? (
                      <span className="inline-flex max-w-30 truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {brand.logo}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700"
                      >
                        Visit
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {brand.description ? (
                      <span className="line-clamp-2 max-w-xs">
                        {brand.description}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        brand.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {brand.updatedAt
                      ? new Date(brand.updatedAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
