from django.contrib import admin
from django.utils import timezone

from .models import Category, Post, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'status', 'is_premium', 'published_at')
    list_filter = ('status', 'is_premium', 'category', 'tags')
    search_fields = ('title', 'summary', 'content')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)
    date_hierarchy = 'published_at'

    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'author', 'status', 'is_premium')
        }),
        ('Content', {
            'fields': ('summary', 'content', 'cover_image_url')
        }),
        ('Classification', {
            'fields': ('category', 'tags')
        }),
        ('Dates', {
            'fields': ('published_at',),
        }),
    )

    actions = ['publish_posts']

    @admin.action(description='Publish selected posts')
    def publish_posts(self, request, queryset):
        queryset.update(status=Post.Status.PUBLISHED, published_at=timezone.now())
