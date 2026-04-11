import apiClient from './api';

/**
 * Get published blog posts (public — no auth required)
 */
export const getBlogPosts = async ({ category, tag, page } = {}) => {
  try {
    const params = {};
    if (category) params.category = category;
    if (tag) params.tag = tag;
    if (page) params.page = page;
    const response = await apiClient.get('/blog/posts/', { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch blog posts.');
  }
};

/**
 * Get a single blog post by slug (public)
 */
export const getBlogPost = async (slug) => {
  try {
    const response = await apiClient.get(`/blog/posts/${slug}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch blog post.');
  }
};

/**
 * Get blog categories
 */
export const getBlogCategories = async () => {
  try {
    const response = await apiClient.get('/blog/categories/');
    return response.data;
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch categories.');
  }
};

/**
 * Get blog tags
 */
export const getBlogTags = async () => {
  try {
    const response = await apiClient.get('/blog/tags/');
    return response.data;
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch tags.');
  }
};
