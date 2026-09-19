import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import { Category } from "@/types";

export default async function CategoriesPage() {
  const { data: categories } = await getCategoriesAdmin();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Categories
        </h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-25">Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.slug || "-"}</TableCell>
                  <TableCell>
                    {category.image ? (
                      <span className="inline-flex max-w-30 truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {category.image}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>
                    {category.description ? (
                      <span className="line-clamp-2 max-w-xs">
                        {category.description}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.isActive ? "default" : "secondary"}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.updatedAt
                      ? new Date(category.updatedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
