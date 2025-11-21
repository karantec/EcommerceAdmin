/* eslint-disable react/prop-types */
/* eslint-disable */
import axios from "axios";
import { Formik, Form } from "formik";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardMedia,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";

const API_URL = "https://ecommercebackend-zniy.onrender.com/api/product";
const CATEGORY_API = "https://ecommercebackend-zniy.onrender.com/api/category/getcategories";

const CLOUDINARY_UPLOAD_PRESET = "marketdata";
const CLOUDINARY_CLOUD_NAME = "de4ks8mkh";

export default function ProductData() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const catRes = await axios.get(CATEGORY_API);
      const cats = catRes.data?.categories || catRes.data?.data || catRes.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error("Failed to load categories:", err?.response?.data || err.message);
      showSnackbar("Failed to load categories", "error");
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const prodRes = await axios.get(API_URL);
      console.log("RAW product response:", prodRes.data); // <-- Inspect this in DevTools console

      // Normalize into an array — try common shapes
      let prodData = [];
      if (Array.isArray(prodRes.data)) {
        prodData = prodRes.data;
      } else if (Array.isArray(prodRes.data?.data)) {
        prodData = prodRes.data.data;
      } else if (Array.isArray(prodRes.data?.products)) {
        prodData = prodRes.data.products;
      } else if (Array.isArray(prodRes.data?.result)) {
        prodData = prodRes.data.result;
      } else if (prodRes.data?.data && typeof prodRes.data.data === "object") {
        // sometimes data object contains the array under another key
        prodData = Object.values(prodRes.data.data).flat().filter(Boolean);
      } else if (prodRes.data?.products && typeof prodRes.data.products === "object") {
        prodData = Object.values(prodRes.data.products).flat().filter(Boolean);
      } else {
        // last fallback: if the server returned object with items inside, try to extract arrays
        prodData = Object.values(prodRes.data)
          .filter((v) => Array.isArray(v))
          .flat();
      }

      // final safety: if still empty but prodRes.data has properties resembling a single product, wrap it
      if (!prodData.length && prodRes.data && prodRes.data._id) prodData = [prodRes.data];

      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      console.error("Failed to load products:", err?.response?.data || err.message);
      showSnackbar("Failed to load products", "error");
      setProducts([]);
    }
  };

  fetchCategories();
  fetchProducts();
}, []);


  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );
    return res.data.secure_url;
  };

  const handleImageUpload = async (event, setFieldValue) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSnackbar("Please select an image file", "error");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFieldValue("image", url);
      showSnackbar("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      showSnackbar("Image upload failed", "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setSubmitting(true);
    setLoading(true);

    // Build payload to match your Mongoose Product model
    const payload = {
      name: values.name,
      brand: values.brand || "Unknown",
      description: values.description || "",
      images: values.image ? [{ url: values.image, alt: values.name || "" }] : [],
      price: {
        mrp: Number(values.mrp || 0),
        sellingPrice: Number(values.sellingPrice || values.mrp || 0),
        discountPercent:
          values.discountPercent !== undefined
            ? Number(values.discountPercent)
            : 0,
      },
      unit: {
        quantity: Number(values.quantity || 1),
        unitType: values.unitType || "pcs",
      },
      category: values.category,
      stock: Number(values.stock || 0),
      isAvailable: values.isAvailable === undefined ? true : !!values.isAvailable,
      // rating is optional on create
    };

    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/${editingProduct._id}`, payload);
        showSnackbar("Product updated successfully");
      } else {
        await axios.post(`${API_URL}/create`, payload);
        showSnackbar("Product added successfully");
      }

      // refresh products list (handle different response shapes)
      const prodRes = await axios.get(API_URL);
      const prodData = prodRes.data?.data || prodRes.data?.products || prodRes.data || [];
      setProducts(prodData);

      resetForm();
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Error saving product", "error");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    // When user clicks edit, set the editing product so Formik reinitializes with its values
    setEditingProduct(product);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showSnackbar("Product deleted successfully");
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete product", "error");
    }
  };

  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));

  const handleNextPage = () => currentPage < totalPages && setCurrentPage((prev) => prev + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage((prev) => prev - 1);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Product Management
      </Typography>

      <Formik
        enableReinitialize
        initialValues={{
          name: editingProduct?.name || "",
          brand: editingProduct?.brand || "",
          category: editingProduct?.category?._id || editingProduct?.category || "",
          mrp: editingProduct?.price?.mrp ?? editingProduct?.price ?? 0,
          sellingPrice: editingProduct?.price?.sellingPrice ?? editingProduct?.price ?? 0,
          discountPercent: editingProduct?.price?.discountPercent ?? 0,
          description: editingProduct?.description || "",
          image: editingProduct?.images?.[0]?.url || "",
          quantity: editingProduct?.unit?.quantity ?? 1,
          unitType: editingProduct?.unit?.unitType || "pcs",
          stock: editingProduct?.stock ?? 0,
          isAvailable: editingProduct?.isAvailable ?? true,
        }}
        validate={(values) => {
          const errors = {};
          if (!values.name) errors.name = "Required";
          if (!values.category) errors.category = "Required";
          if (!values.mrp || Number(values.mrp) <= 0) errors.mrp = "MRP must be > 0";
          if (!values.sellingPrice || Number(values.sellingPrice) <= 0)
            errors.sellingPrice = "Selling price must be > 0";
          if (!values.image) errors.image = "Image is required";
          return errors;
        }}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, handleChange, isSubmitting }) => (
          <Form>
            <Grid container spacing={3}>
              {/* Left Form */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Product Info
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        name="name"
                        label="Product Name"
                        fullWidth
                        required
                        value={values.name}
                        onChange={handleChange}
                        error={touched.name && !!errors.name}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        name="brand"
                        label="Brand"
                        fullWidth
                        value={values.brand}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        select
                        name="category"
                        label="Category"
                        fullWidth
                        required
                        value={values.category}
                        onChange={handleChange}
                        error={touched.category && !!errors.category}
                        helperText={touched.category && errors.category}
                      >
                        <MenuItem value="">
                          <em>Select Category</em>
                        </MenuItem>
                        {categories.map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        name="description"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={values.description}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Pricing & Stock
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        name="mrp"
                        label="MRP (₹)"
                        type="number"
                        fullWidth
                        required
                        value={values.mrp}
                        onChange={handleChange}
                        error={touched.mrp && !!errors.mrp}
                        helperText={touched.mrp && errors.mrp}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        name="sellingPrice"
                        label="Selling Price (₹)"
                        type="number"
                        fullWidth
                        required
                        value={values.sellingPrice}
                        onChange={handleChange}
                        error={touched.sellingPrice && !!errors.sellingPrice}
                        helperText={touched.sellingPrice && errors.sellingPrice}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        name="quantity"
                        label="Unit Quantity"
                        type="number"
                        fullWidth
                        required
                        value={values.quantity}
                        onChange={handleChange}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        select
                        name="unitType"
                        label="Unit Type"
                        fullWidth
                        value={values.unitType}
                        onChange={handleChange}
                      >
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="ml">ml</MenuItem>
                        <MenuItem value="l">l</MenuItem>
                        <MenuItem value="pack">pack</MenuItem>
                        <MenuItem value="pcs">pcs</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        name="stock"
                        label="Stock Quantity"
                        type="number"
                        fullWidth
                        required
                        value={values.stock}
                        onChange={handleChange}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={6} display="flex" alignItems="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!values.isAvailable}
                            onChange={(e) => setFieldValue("isAvailable", e.target.checked)}
                          />
                        }
                        label="Available"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right Form */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Product Image
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={uploading}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {uploading ? "Uploading..." : values.image ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setFieldValue)}
                    />
                  </Button>

                  {errors.image && touched.image && (
                    <Typography color="error" variant="caption" display="block" sx={{ mb: 1 }}>
                      {errors.image}
                    </Typography>
                  )}

                  {values.image && (
                    <Box sx={{ textAlign: "center" }}>
                      <img
                        src={values.image}
                        alt={values.name}
                        style={{
                          width: "100%",
                          maxHeight: 300,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setFieldValue("image", "")}
                        sx={{ mt: 1 }}
                      >
                        Remove Image
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* Product Preview Card */}
                {values.image && (
                  <Card>
                    <CardMedia component="img" height="200" image={values.image} alt={values.name} />
                    <CardContent>
                      <Typography variant="h6">{values.name || "Product Name"}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {values.description || "No description provided"}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: "bold" }}>
                        ₹{values.sellingPrice || values.mrp || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {values.stock || 0} units
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>

            <Box textAlign="center" mt={4}>
              {editingProduct && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditingProduct(null);
                  }}
                  sx={{ mr: 2 }}
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={isSubmitting || loading} size="large">
                {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>

      {/* Product Table */}
      <Paper sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ p: 2, fontWeight: "bold" }}>
          All Products ({products.length})
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentProducts.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <img
                      src={p.images?.[0]?.url || p.image || "https://via.placeholder.com/50"}
                      alt={p.name}
                      style={{ width: 50, height: 50, borderRadius: 4, objectFit: "cover" }}
                    />
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.category?.name || (typeof p.category === "string" ? p.category : "-")}</TableCell>
                  <TableCell>₹{p.price?.sellingPrice ?? p.price ?? "-"}</TableCell>
                  <TableCell>{p.stock ?? 0}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(p)}>
                      <MdEdit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(p._id)}>
                      <MdDelete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box p={2} display="flex" justifyContent="center" alignItems="center" gap={2}>
          <Button variant="outlined" disabled={currentPage === 1} onClick={handlePrevPage}>
            Previous
          </Button>
          <Typography>
            Page {currentPage} of {totalPages}
          </Typography>
          <Button variant="outlined" disabled={currentPage === totalPages} onClick={handleNextPage}>
            Next
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
