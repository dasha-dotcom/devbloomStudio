import type { ImageOption } from "@/lib/projects";

type ImagePickerProps = {
  images: ImageOption[];
  selectedImageId: string;
  onSelect: (id: string) => void;
};

export function ImagePicker({
  images,
  selectedImageId,
  onSelect,
}: ImagePickerProps) {
  return (
    <div className="picker-grid">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          className={`image-card ${selectedImageId === image.id ? "active" : ""}`}
          onClick={() => onSelect(image.id)}
        >
          <img className="image-thumb" src={image.src} alt={image.alt} />
          <strong>{image.name}</strong>
          <p className="muted">{image.description}</p>
        </button>
      ))}
    </div>
  );
}
