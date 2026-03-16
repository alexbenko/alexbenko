from django.db import models


class Album(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # The photo to use as og:image / social media preview.
    # Null means "use the first photo" (resolved at serialization time).
    social_preview_photo = models.ForeignKey(
        'Photo',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='preview_for_albums',
    )

    def __str__(self):
        return self.title

    def get_social_preview_url(self):
        """Return the URL of the social preview photo, defaulting to the first photo."""
        if self.social_preview_photo_id:
            return self.social_preview_photo.image.url
        first = self.photos.order_by('position', 'id').first()
        return first.image.url if first else None


class Photo(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='albums/')
    caption = models.CharField(max_length=255, blank=True)
    # Lower number = earlier in album order
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f"{self.album.title} – photo {self.id}"
