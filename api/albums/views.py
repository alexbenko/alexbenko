from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Album
from .serializers import AlbumSerializer


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.prefetch_related('photos').all()
    serializer_class = AlbumSerializer

    @action(detail=True, methods=['patch'], url_path='social-preview')
    def set_social_preview(self, request, pk=None):
        """
        PATCH /api/albums/{id}/social-preview/
        Body: { "social_preview_photo_id": <int|null> }

        Pass null to reset to the default (first photo).
        """
        album = self.get_object()
        serializer = AlbumSerializer(
            album,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
