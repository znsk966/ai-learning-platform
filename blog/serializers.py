from rest_framework import serializers

from .models import Category, Post, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for blog listing — no full content."""
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'summary', 'cover_image_url',
            'author_name', 'category', 'tags', 'is_premium',
            'published_at',
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username


class PostDetailSerializer(PostListSerializer):
    """Serializer for blog detail — includes full content."""
    content = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['content', 'created_at', 'updated_at']

    def get_content(self, obj):
        """Return content only if user has access (free post or paid subscriber)."""
        request = self.context.get('request')
        if not obj.is_premium:
            return obj.content

        # Premium post: check subscription
        if request and request.user and request.user.is_authenticated:
            from ai_tutor.models import Subscription
            try:
                sub = Subscription.objects.get(user=request.user)
                if sub.is_active and sub.tier != Subscription.SubscriptionTier.FREE:
                    return obj.content
            except Subscription.DoesNotExist:
                pass

        return None
