import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const CATEGORY_ICON_OPTIONS = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical_services", label: "Electrical" },
  { value: "carpenter", label: "Carpentry" },
  { value: "format_paint", label: "Painting" },
  { value: "cleaning_services", label: "Cleaning" },
  { value: "yard", label: "Landscaping" },
  { value: "home_repair_service", label: "Home Repair" },
  { value: "build", label: "Maintenance" },
  { value: "handyman", label: "Handyman" },
  { value: "category", label: "General" },
];

const CategoryManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [deleteCategory, setDeleteCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("category");

  const fetchCategories = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(
        (data.categories || []).map((c: any) => ({
          id: c._id,
          name: c.name,
          description: c.description,
          icon: c.icon || "category",
          iconBg: "bg-blue-50 text-blue-600",
          workers: typeof c.workerCount === "number" ? c.workerCount : 0,
          status: c.isActive ? "Active" : "Inactive",
        })),
      );
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const PAGE_SIZE = 8;

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));

  const paginated = categories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEditModal = (cat: any) => {
    setEditCategoryId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description);
    setEditIcon(cat.icon || "category");
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryId) return;
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${API_BASE_URL}/admin/categories/${editCategoryId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            description: editDesc,
            icon: editIcon,
          }),
        },
      );
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/categories/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteCategory({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/categories/${deleteCategory.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setDeleteCategory(null);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          icon: newIcon || "category",
        }),
      });

        if (res.ok) {
          setIsAddModalOpen(false);
          setNewName("");
          setNewDesc("");
          setNewIcon("category");
          fetchCategories();
        }
    } catch (error) {
      console.error("Failed to create category", error);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">
          Category Management
        </h1>
      </div>

      {/* Filter & Add Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="h-11 px-6 rounded-xl border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">
            filter_list
          </span>
          Filter
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 px-6 bg-primary text-white rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-primary-dark transition-all shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paginated.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex flex-col gap-6">
              <div
                className={`size-12 rounded-xl ${category.iconBg} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {category.icon}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#120e1b]">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="h-px bg-gray-50"></div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-lg">
                    engineering
                  </span>
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    {category.workers} Workers
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      category.status === "Active"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {category.status === "Active" ? "On" : "Off"}
                  </span>
                  <button
                    onClick={() =>
                      handleToggleStatus(
                        category.id,
                        category.status === "Active",
                      )
                    }
                    role="switch"
                    aria-checked={category.status === "Active"}
                    aria-label={`Set ${category.name} ${category.status === "Active" ? "inactive" : "active"}`}
                    title={category.status}
                    className={`relative h-6 w-11 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                      category.status === "Active"
                        ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/30"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center ${
                        category.status === "Active"
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[11px] ${
                          category.status === "Active"
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {category.status === "Active" ? "check" : "close"}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => openEditModal(category)}
                    title="Edit category"
                    aria-label={`Edit ${category.name}`}
                    className="size-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(category.id, category.name)}
                    title="Delete category"
                    aria-label={`Delete ${category.name}`}
                    className="size-8 rounded-md border border-red-100 text-red-600 hover:bg-red-50 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Category"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">
              Category Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Landscaping"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary text-sm font-medium dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">
              Description
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe the skills and services in this category..."
              className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary text-sm font-medium dark:text-white resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">
              Category Icon
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_ICON_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setNewIcon(item.value)}
                  className={`h-12 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                    newIcon === item.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.value}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Preview:</span>
              <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">
                  {newIcon}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCategory}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              Create Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Category"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b]">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-100"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b]">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full h-24 p-3 rounded-xl bg-gray-50 border border-gray-100"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b]">Icon</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_ICON_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setEditIcon(item.value)}
                  className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                    editIcon === item.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.value}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 h-12 rounded-xl border border-gray-200 font-bold text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCategory}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteCategory(null);
        }}
        title="Delete Category"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#120e1b]">
              {deleteCategory?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteCategory(null);
              }}
              className="flex-1 h-12 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCategory}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <p className="text-xs font-medium text-gray-500 tracking-wider">
          Showing{" "}
          <span className="text-[#120e1b]">{(page - 1) * PAGE_SIZE + 1}</span> -{" "}
          <span className="text-[#120e1b]">
            {Math.min(page * PAGE_SIZE, categories.length)}
          </span>{" "}
          of <span className="text-[#120e1b]">{categories.length}</span>{" "}
          categories
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-9 px-4 rounded-lg text-xs font-bold text-gray-400 hover:text-primary disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`size-9 rounded-lg text-xs font-bold ${p === page ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-9 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;
