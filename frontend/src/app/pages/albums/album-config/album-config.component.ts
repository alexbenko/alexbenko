import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

export interface Photo {
  id: number;
  image_url: string;
  caption: string;
  position: number;
}

export interface Album {
  id: number;
  title: string;
  description: string;
  photos: Photo[];
  social_preview_photo_id: number | null;
  social_preview_url: string | null;
}

@Component({
  selector: 'app-album-config',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './album-config.component.html',
  styleUrl: './album-config.component.scss',
})
export class AlbumConfigComponent implements OnInit {
  album: Album | null = null;
  loading = true;
  saving = false;

  /** The photo ID currently staged as the selection (not yet saved). */
  selectedPhotoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<Album>(`/api/albums/${id}/`).subscribe({
      next: album => {
        this.album = album;
        // Initialise selection: use saved value or default to first photo's id
        this.selectedPhotoId = album.social_preview_photo_id ?? album.photos[0]?.id ?? null;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load album.', 'Dismiss', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  selectPhoto(photo: Photo): void {
    this.selectedPhotoId = photo.id;
  }

  isSelected(photo: Photo): boolean {
    return this.selectedPhotoId === photo.id;
  }

  /** True when the user's staged selection differs from what is saved. */
  get isDirty(): boolean {
    if (!this.album) return false;
    const saved = this.album.social_preview_photo_id ?? this.album.photos[0]?.id ?? null;
    return this.selectedPhotoId !== saved;
  }

  /** The first photo acts as the implicit default when nothing is saved. */
  isDefault(photo: Photo): boolean {
    return !this.album?.social_preview_photo_id && photo.id === this.album?.photos[0]?.id;
  }

  savePreview(): void {
    if (!this.album) return;
    this.saving = true;

    // Send null if user picked the first photo and nothing was explicitly saved
    // (let the server default logic stay clean), otherwise send the photo id.
    const firstId = this.album.photos[0]?.id ?? null;
    const payload = {
      social_preview_photo_id:
        this.selectedPhotoId === firstId && !this.album.social_preview_photo_id
          ? null
          : this.selectedPhotoId,
    };

    this.http
      .patch<Album>(`/api/albums/${this.album.id}/social-preview/`, payload)
      .subscribe({
        next: updated => {
          this.album = updated;
          this.selectedPhotoId =
            updated.social_preview_photo_id ?? updated.photos[0]?.id ?? null;
          this.saving = false;
          this.snackBar.open('Social media preview saved.', 'Dismiss', { duration: 3000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Failed to save. Please try again.', 'Dismiss', { duration: 4000 });
        },
      });
  }
}
