import { MapPin } from "lucide-react";
import { BookLocation } from "@/types";

export function LocationTag({ location }: { location?: BookLocation | null }) {
  if (!location) {
    return <span className="text-xs text-muted-foreground italic">No location assigned</span>;
  }

  const { shelf, row, position } = location;
  const { room } = shelf;
  const { floor } = room;

  return (
    <span className="location-tag">
      <MapPin className="h-3 w-3" />
      <span>{floor.name}</span>
      <span className="separator">›</span>
      <span>{room.name}</span>
      <span className="separator">›</span>
      <span>{shelf.name}</span>
      <span className="separator">›</span>
      <span>{row}</span>
      <span className="separator">›</span>
      <span>{position}</span>
    </span>
  );
}
