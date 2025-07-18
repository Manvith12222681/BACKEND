const Product = require("../models/product.model");
const uploadOnCloudinary = require("../Utils/uploadOnCloudinary");

// ========== CREATE PRODUCT ==========
const createProduct = async (req, res) => {
  try {
    const { name, category, price, availability } = req.body;
    let imageUrl = null;

    if (req.file?.path) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      if (!uploadResult?.secure_url) {
        return res.status(500).json({ message: "Image upload failed" });
      }
      imageUrl = uploadResult.secure_url;
    }

    const product = new Product({
      name,
      category,
      price,
      availability,
      image: imageUrl,
      postedBy: req.userId,
    });

    await product.save();
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== GET ALL PRODUCTS ==========
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("postedBy", "name email");
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== GET PRODUCT BY ID ==========
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("postedBy", "name email");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== GET MY PRODUCTS ==========
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ postedBy: req.userId });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== UPDATE PRODUCT ==========
const updateProduct = async (req, res) => {
  try {
    const { name, category, price, availability } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized to update this product" });
    }

    let imageUrl = product.image;
    if (req.file?.path) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      if (uploadResult?.secure_url) {
        imageUrl = uploadResult.secure_url;
      }
    }

    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.availability = availability !== undefined ? availability : product.availability;
    product.image = imageUrl;

    await product.save();
    return res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== DELETE PRODUCT ==========
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ========== SEARCH BY CATEGORY ==========
const searchByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "Category is required in query" });
    }

    const products = await Product.find({
      category: { $regex: category, $options: "i" },
    });

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  searchByCategory,
};
