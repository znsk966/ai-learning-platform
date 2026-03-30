# ai-powered-learning/backend/permissions.py

from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    Read-only access is allowed for anyone.
    """

    def has_permission(self, request, view):
        # Read permissions (GET, HEAD, OPTIONS) are allowed for any request,
        # so we'll always allow these.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin/staff users.
        # request.user.is_staff is a Django flag for admin users.
        return request.user and request.user.is_staff