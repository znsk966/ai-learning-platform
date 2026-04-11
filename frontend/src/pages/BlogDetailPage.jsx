import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost } from '../api/blogService';
import { useAuth } from '../store/authContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBlogPost(slug);
      setPost(data);
    } catch (err) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  if (loading) return <LoadingSpinner text="Loading post..." />;

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!post) return null;

  const contentLocked = post.is_premium && post.content === null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
          &larr; Back to Blog
        </Link>

        {post.cover_image_url && (
          <div className="rounded-xl overflow-hidden mb-6">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
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

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">{post.title}</h1>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span>{post.author_name}</span>
          <span>&middot;</span>
          <span>{formatDate(post.published_at)}</span>
        </div>

        {contentLocked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Premium Content</h3>
            <p className="text-gray-600 mb-4">
              This post is available to subscribers with an active paid plan.
            </p>
            {!user ? (
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in
              </Link>
            ) : (
              <Link
                to="/subscription"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Upgrade Subscription
              </Link>
            )}
          </div>
        ) : (
          <article className="prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </article>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
