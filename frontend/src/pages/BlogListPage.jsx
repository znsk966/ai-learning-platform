import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBlogPosts, getBlogCategories } from '../api/blogService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../store/authContext';

const BlogListPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [postsData, catsData] = await Promise.all([
        getBlogPosts({ category: activeCategory || undefined }),
        categories.length ? Promise.resolve(null) : getBlogCategories(),
      ]);
      setPosts(postsData.results || postsData);
      if (catsData) setCategories(catsData.results || catsData);
    } catch (err) {
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, categories.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGuestSelect = (slug) => {
    navigate('/login', {
      state: {
        from: { pathname: `/blog/${slug}` },
        message: 'You must create an account first to read the full blog post.',
        messageType: 'info',
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Blog</h1>
        <p className="text-gray-600 mb-8">{isAuthenticated ? 'Insights, tutorials, and updates from our team.' : 'Browse blog titles as a guest. Create an account to read full articles.'}</p>

        {!isAuthenticated && (
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            Guest access shows post titles only. Create an account when you want to open the full article.
          </div>
        )}

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading && <LoadingSpinner text="Loading posts..." />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No posts yet. Check back soon!</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              isAuthenticated ? (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {post.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {post.category.name}
                        </span>
                      )}
                      {post.is_premium && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.summary && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.summary}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{post.author_name}</span>
                      <span>&middot;</span>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleGuestSelect(post.slug)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-5 text-left shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      Title only
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2 transition-colors hover:text-blue-600">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{post.author_name}</span>
                    <span>&middot;</span>
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-4 text-sm font-semibold text-blue-600">
                    Create account to read →
                  </div>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;
