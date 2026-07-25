import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { bookFormSchema, BookFormSchema } from "./bookFormSchema";
import { useBook, useCreateBook, useUpdateBook } from "@/hooks/useBooks";
import { useAuthors, usePublishers, useCategories } from "@/hooks/useCatalog";
import { useFloors, useRooms, useShelves } from "@/hooks/useStructure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { BOOK_TYPE_LABELS, BOOK_CONDITION_LABELS } from "@/lib/constants";

export function BookFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existingBook, isLoading: loadingBook } = useBook(id);
  const { data: authors } = useAuthors();
  const { data: publishers } = usePublishers();
  const { data: categories } = useCategories();
  const { data: floors } = useFloors();

  const createBook = useCreateBook();
  const updateBook = useUpdateBook(id ?? "");

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookFormSchema>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: { language: "English", condition: "NEW" },
  });

  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const { data: rooms } = useRooms(selectedFloorId || undefined);
  const { data: shelves } = useShelves(selectedRoomId || undefined);

  // Populate the form once the existing book loads (edit mode).
  useEffect(() => {
    if (existingBook) {
      reset({
        accessionNumber: existingBook.accessionNumber,
        isbn: existingBook.isbn ?? "",
        barcodeNumber: existingBook.barcodeNumber ?? "",
        title: existingBook.title,
        subtitle: existingBook.subtitle ?? "",
        authorId: existingBook.authorId,
        publisherId: existingBook.publisherId,
        publicationYear: existingBook.publicationYear ? String(existingBook.publicationYear) : "",
        edition: existingBook.edition ?? "",
        volume: existingBook.volume ?? "",
        categoryId: existingBook.categoryId,
        subject: existingBook.subject ?? "",
        language: existingBook.language,
        description: existingBook.description ?? "",
        keywords: existingBook.keywords ?? "",
        bookType: existingBook.bookType,
        numberOfPages: existingBook.numberOfPages ? String(existingBook.numberOfPages) : "",
        condition: existingBook.condition,
        shelfId: existingBook.location?.shelf.id ?? "",
        row: existingBook.location?.row ?? "",
        position: existingBook.location?.position ?? "",
      } as unknown as BookFormSchema);

      if (existingBook.location) {
        setSelectedFloorId(existingBook.location.shelf.room.floor.id);
        setSelectedRoomId(existingBook.location.shelf.room.id);
      }
    }
  }, [existingBook, reset]);

  const shelfId = watch("shelfId");

  async function onSubmit(values: BookFormSchema) {
    try {
      const payload = { ...values };
      // Don't send an incomplete location - all three or none.
      if (!payload.shelfId || !payload.row || !payload.position) {
        delete payload.shelfId;
        delete payload.row;
        delete payload.position;
      }
      delete (payload as Record<string, unknown>).floorId;
      delete (payload as Record<string, unknown>).roomId;

      if (isEdit) {
        await updateBook.mutateAsync(payload);
        toast("Book updated successfully", "success");
      } else {
        const created = await createBook.mutateAsync(payload as never);
        toast("Book added successfully", "success");
        navigate(`/books/${created.id}`);
        return;
      }
      navigate(`/books/${id}`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  if (isEdit && loadingBook) {
    return <p className="text-sm text-muted-foreground">Loading book...</p>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link to={isEdit ? `/books/${id}` : "/books"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          {isEdit ? "Edit Book" : "Add Book"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Section title="Bibliographic Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" error={errors.title?.message}>
              <Input {...register("title")} />
            </Field>
            <Field label="Subtitle">
              <Input {...register("subtitle")} />
            </Field>
            <Field label="Author" error={errors.authorId?.message}>
              <Controller
                control={control}
                name="authorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!authors?.length && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No authors yet — <Link to="/authors" className="underline">add one first</Link>
                </p>
              )}
            </Field>
            <Field label="Publisher" error={errors.publisherId?.message}>
              <Controller
                control={control}
                name="publisherId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select publisher" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishers?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Publication Year">
              <Input type="number" {...register("publicationYear")} />
            </Field>
            <Field label="Edition">
              <Input {...register("edition")} placeholder="e.g. 3rd Edition" />
            </Field>
            <Field label="Volume">
              <Input {...register("volume")} />
            </Field>
            <Field label="Language">
              <Input {...register("language")} />
            </Field>
          </div>
        </Section>

        <Section title="Classification">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.categoryId?.message}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Book Type" error={errors.bookType?.message}>
              <Controller
                control={control}
                name="bookType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Subject">
              <Input {...register("subject")} />
            </Field>
            <Field label="Condition">
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BOOK_CONDITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Keywords" className="col-span-2">
              <Input {...register("keywords")} placeholder="Comma-separated, used in search" />
            </Field>
            <Field label="Description" className="col-span-2">
              <Textarea {...register("description")} rows={3} />
            </Field>
          </div>
        </Section>

        <Section title="Identifiers">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Accession Number" error={errors.accessionNumber?.message}>
              <Input {...register("accessionNumber")} className="font-mono" />
            </Field>
            <Field label="ISBN">
              <Input {...register("isbn")} className="font-mono" />
            </Field>
            <Field label="Barcode Number">
              <Input {...register("barcodeNumber")} className="font-mono" />
            </Field>
            <Field label="Number of Pages">
              <Input type="number" {...register("numberOfPages")} />
            </Field>
          </div>
        </Section>

        <Section title="Physical Location" description="Where this book sits on the shelf">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Floor">
              <Select
                value={selectedFloorId}
                onValueChange={(v) => {
                  setSelectedFloorId(v);
                  setSelectedRoomId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Room">
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!selectedFloorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Shelf">
              <Controller
                control={control}
                name="shelfId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shelf" />
                    </SelectTrigger>
                    <SelectContent>
                      {shelves?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Row">
              <Input {...register("row")} placeholder="e.g. Row 3" disabled={!shelfId} />
            </Field>
            <Field label="Position">
              <Input {...register("position")} placeholder="e.g. Position 18" disabled={!shelfId} />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Book"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
