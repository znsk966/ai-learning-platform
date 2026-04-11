from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Category, Post, Tag
from .serializers import CategorySerializer, PostDetailSerializer, PostListSerializer, TagSerializer


class PostViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only viewset for blog posts."""
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Post.objects.filter(status=Post.Status.PUBLISHED).select_related(
            'author', 'category'
        ).prefetch_related('tags')

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__slug=tag)

        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostListSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only viewset for blog categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only viewset for blog tags."""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
