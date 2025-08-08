import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const FilterSidebar = ({ isSidebarOpen, setIsSidebarOpen } : { isSidebarOpen: boolean ,setIsSidebarOpen : Function}) => {
  // Simulating search params for demo purposes
  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  const navigate = useNavigate();


  type Filters = {
    category: string;
    gender: string;
    color: string;
    size: string[];
    material: string[];
    brand: string[];
    minPrice: number;
    maxPrice: number;
  };

  const [filters, setFilters] = useState<Filters>({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
  });

  const categories = ["Top Wear", "Bottom Wear"];
  const colors = [
    "Red",
    "Blue",
    "Black",
    "Green",
    "Yellow",
    "Gray",
    "White",
    "Pink",
    "Beige",
    "Navy",
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const materials = [
    "Cotton",
    "Wool",
    "Denim",
    "Polyester",
    "Silk",
    "Linen",
    "Viscose",
    "Fleece",
  ];
  const brands = [
    "Urban Threads",
    "Modern Fit",
    "Street Style",
    "Beach Breeze",
    "Fashionista",
    "ChicStyle",
  ];
  const genders = ["Men", "Women"];

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice ? Number(params.minPrice) : 0,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : 100,
    });
  }, [searchParams]);

  // Handle input changes (radio buttons, checkboxes, range)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;

    if (type === "radio") {
      // Handle radio buttons (category, gender)
      const newFilters = { ...filters, [name]: value };
      setFilters(newFilters);
      updateSearchParams(newFilters);
    } else if (type === "checkbox") {
      // Handle checkboxes (size, material, brand)
      const currentValues = filters[name as keyof Filters] as string[];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter((item) => item !== value);

      const newFilters = { ...filters, [name]: newValues };
      setFilters(newFilters);
      updateSearchParams(newFilters);
    } else if (type === "range") {
      // Handle price range
      const newPrice = Number(value);
      const newFilters = { ...filters, maxPrice: newPrice };
      setFilters(newFilters);
      updateSearchParams(newFilters);
    }
  };

  // Handle button clicks (color selection)
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { name, value } = e.currentTarget;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  // Update URL search parameters
  const updateSearchParams = (newFilters: Filters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        }
      } else if (value && value !== 0) {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params);

    // Navigate to update the URL with query parameters
    const queryString = params.toString();
    navigate(queryString ? `?${queryString}` : "", { replace: true });
  };

  return (
    <div className={`p-4 w-56 sm:w-72 lg:w-full bg-white min-h-screen overflow-y-auto`}>
      <div className="flex justify-end p-4 lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 hover:text-red-500 text-2xl"
        >
          <IoMdClose />
        </button>
      </div>
      <h3 className="text-xl font-medium text-gray-800 mb-4">Filter</h3>
      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Category</label>
        {categories.map((category) => (
          <div key={category} className="flex items-center mb-1">
            <input
              type="radio"
              name="category"
              id={`category-${category}`}
              value={category}
              checked={filters.category === category}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <label
              htmlFor={`category-${category}`}
              className="text-gray-700 cursor-pointer"
            >
              {category}
            </label>
          </div>
        ))}
      </div>

      {/* Gender Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Gender</label>
        {genders.map((gender) => (
          <div key={gender} className="flex items-center mb-1">
            <input
              type="radio"
              name="gender"
              id={`gender-${gender}`}
              value={gender}
              checked={filters.gender === gender}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <label
              htmlFor={`gender-${gender}`}
              className="text-gray-700 cursor-pointer"
            >
              {gender}
            </label>
          </div>
        ))}
      </div>

      {/* Color Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              name="color"
              value={color}
              onClick={handleButtonClick}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition hover:scale-105 ${
                filters.color === color ? "border-blue-500" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.toLowerCase() }}
              title={color}
            ></button>
          ))}
        </div>
        {filters.color && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {filters.color}
          </p>
        )}
      </div>

      {/* Size Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Size</label>
        {sizes.map((size) => (
          <div key={size} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="size"
              id={`size-${size}`}
              value={size}
              checked={filters.size.includes(size)}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <label
              htmlFor={`size-${size}`}
              className="text-gray-700 cursor-pointer"
            >
              {size}
            </label>
          </div>
        ))}
      </div>

      {/* Material Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Material</label>
        {materials.map((material) => (
          <div key={material} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="material"
              id={`material-${material}`}
              value={material}
              checked={filters.material.includes(material)}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <label
              htmlFor={`material-${material}`}
              className="text-gray-700 cursor-pointer"
            >
              {material}
            </label>
          </div>
        ))}
      </div>

      {/* Brand Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Brand</label>
        {brands.map((brand) => (
          <div key={brand} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="brand"
              id={`brand-${brand}`}
              value={brand}
              checked={filters.brand.includes(brand)}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <label
              htmlFor={`brand-${brand}`}
              className="text-gray-700 cursor-pointer"
            >
              {brand}
            </label>
          </div>
        ))}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">
          Price Range
        </label>
        <input
          type="range"
          name="maxPrice"
          min={0}
          max={500}
          value={filters.maxPrice}
          onChange={handleInputChange}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-gray-600 mt-2">
          <span>${filters.minPrice}</span>
          <span>${filters.maxPrice}</span>
        </div>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={() => {
          const resetFilters = {
            category: "",
            gender: "",
            color: "",
            size: [],
            material: [],
            brand: [],
            minPrice: 0,
            maxPrice: 100,
          };
          setFilters(resetFilters);
          setSearchParams(new URLSearchParams());
          navigate("", { replace: true });
        }}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded transition"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
