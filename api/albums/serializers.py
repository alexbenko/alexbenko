from rest_framework import serializers
from .models import Album, Photo


class PhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'image_url', 'caption', 'position']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class AlbumSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    social_preview_photo_id = serializers.PrimaryKeyRelatedField(
        source='social_preview_photo',
        queryset=Photo.objects.all(),
        allow_null=True,
        required=False,
    )
    # Resolved URL for use in og:image — null falls back to first photo
    social_preview_url = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            'id',
            'title',
            'description',
            'photos',
            'social_preview_photo_id',
            'social_preview_url',
        ]

    def get_social_preview_url(self, obj):
        request = self.context.get('request')
        url = obj.get_social_preview_url()
        if url and request:
            return request.build_absolute_uri(url)
        return url

    def validate_social_preview_photo_id(self, photo):
        """Ensure the chosen photo belongs to this album."""
        album = self.instance
        if album and photo and photo.album_id != album.id:
            raise serializers.ValidationError(
                "The selected photo does not belong to this album."
            )
        return photo
