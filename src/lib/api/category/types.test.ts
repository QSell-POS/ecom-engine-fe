import { describe, expect, it } from "vitest";
import { parentCategoryOptions, type Category } from "./types";

const category = (id: string, name: string, parentId: string | null = null): Category => ({ id, name, slug: id, parentId });

const kids = category("kids", "Kids");
const tshirts = category("tshirts", "T-Shirts", "kids");
const graphic = category("graphic", "Graphic", "tshirts");
const men = category("men", "Men");

describe("parentCategoryOptions", () => {
  it("labels every category with its full path", () => {
    expect(parentCategoryOptions([kids, tshirts, graphic, men])).toEqual([
      { id: "kids", name: "Kids" },
      { id: "tshirts", name: "Kids › T-Shirts" },
      { id: "graphic", name: "Kids › T-Shirts › Graphic" },
      { id: "men", name: "Men" },
    ]);
  });

  it("leaves out the category being edited and everything below it", () => {
    expect(parentCategoryOptions([kids, tshirts, graphic, men], "tshirts").map((o) => o.id)).toEqual(["kids", "men"]);
  });

  it("survives a cycle in the data", () => {
    const a = category("a", "A", "b");
    const b = category("b", "B", "a");
    expect(parentCategoryOptions([a, b])).toHaveLength(2);
  });
});
