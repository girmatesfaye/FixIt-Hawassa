
import React, { useState } from 'react';
import Modal from '../components/Modal';

const CategoryManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const categories = [
    {
      id: 1,
      name: 'Plumbing',
      description: 'Installation and repair of pipes, fittings, and...',
      icon: 'plumbing',
      iconBg: 'bg-blue-50 text-blue-600',
      workers: 124,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Electrical',
      description: 'Wiring, circuit installation, and electrical repairs.',
      icon: 'bolt',
      iconBg: 'bg-amber-50 text-amber-600',
      workers: 98,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Painting',
      description: 'Interior and exterior painting and finishing.',
      icon: 'format_paint',
      iconBg: 'bg-purple-50 text-purple-600',
      workers: 42,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Carpentry',
      description: 'Furniture making, structural woodwork, an...',
      icon: 'carpenter',
      iconBg: 'bg-orange-50 text-orange-600',
      workers: 65,
      status: 'Active'
    },
    {
      id: 5,
      name: 'Cleaning',
      description: 'Residential and commercial cleaning...',
      icon: 'cleaning_services',
      iconBg: 'bg-green-50 text-green-600',
      workers: 150,
      status: 'Active'
    },
    {
      id: 6,
      name: 'Masonry',
      description: 'Bricklaying, stonework, and concrete pouring.',
      icon: 'foundation',
      iconBg: 'bg-gray-50 text-gray-600',
      workers: 76,
      status: 'Active'
    },
    {
      id: 7,
      name: 'Moving',
      description: 'Relocation assistance, loading, and unloading.',
      icon: 'local_shipping',
      iconBg: 'bg-indigo-50 text-indigo-600',
      workers: 30,
      status: 'Active'
    },
    {
      id: 8,
      name: 'Appliance Repair',
      description: 'Repair of household electronics and...',
      icon: 'build',
      iconBg: 'bg-red-50 text-red-600',
      workers: 25,
      status: 'Inactive'
    }
  ];

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">Category Management</h1>
      </div>

      {/* Filter & Add Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary" 
          />
        </div>
        <button className="h-11 px-6 rounded-xl border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
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
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex flex-col gap-6">
              <div className={`size-12 rounded-xl ${category.iconBg} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-2xl">{category.icon}</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#120e1b]">{category.name}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="h-px bg-gray-50"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-lg">engineering</span>
                  <span className="text-xs font-medium text-gray-600">{category.workers} Workers</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase ${
                  category.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {category.status}
                </span>
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
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">Category Name</label>
            <input 
              type="text" 
              placeholder="e.g. Landscaping" 
              className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary text-sm font-medium dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">Description</label>
            <textarea 
              placeholder="Describe the skills and services in this category..."
              className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary text-sm font-medium dark:text-white resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#120e1b] dark:text-white">Category Icon</label>
            <div className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <div className="size-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-primary shadow-sm transition-colors">
                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary">Click to upload <span className="text-gray-500 font-medium">or drag and drop</span></p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">SVG, PNG, JPG (MAX. 800x800px)</p>
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
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              Create Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <p className="text-xs font-medium text-gray-500 tracking-wider">
          Showing <span className="text-[#120e1b]">1-8</span> of <span className="text-[#120e1b]">12</span> categories
        </p>
        <div className="flex items-center gap-1">
          <button className="h-9 px-4 rounded-lg text-xs font-bold text-gray-400 hover:text-primary disabled:opacity-50">Previous</button>
          <button className="size-9 rounded-lg bg-primary text-white text-xs font-bold">1</button>
          <button className="size-9 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">2</button>
          <span className="px-2 text-gray-300">...</span>
          <button className="h-9 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-primary">Next</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;
