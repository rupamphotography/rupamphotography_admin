import cloudinaryModule from 'cloudinary';

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let category = '';
  if (req.query && req.query.category) {
    category = req.query.category;
  } else {
    // Fallback for custom vite dev server which doesn't parse req.query
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    category = url.searchParams.get('category');
  }

  const tagToFetch = !category || category === 'all' ? 'portfolio' : category;

  // Define how many images to fetch per category
  const CATEGORY_LIMITS = {
    portfolio: 8, // 'All' category
    wedding: 8,
    bridal: 8,
    fashion: 8,
    portrait: 8,
    nature: 8,
    street: 8
  };

  // Default to 8 if the category isn't in the list
  let maxResults = CATEGORY_LIMITS[tagToFetch] || 8;
  if (tagToFetch.endsWith('_header') || tagToFetch === 'hero' || tagToFetch === 'about') {
    maxResults = 1;
  }

  try {
    const result = await cloudinary.api.resources_by_tag(tagToFetch, {
      max_results: maxResults,
      context: true,
      tags: true,
      direction: 'desc' // Ensures we get the most recently uploaded images first
    });

    return res.status(200).json({ resources: result.resources });
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
}
