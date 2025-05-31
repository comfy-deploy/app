import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addNewAPIKey } from "./api-key-api";
import { CopyButton } from "./copy-button";
import { LoadingIcon } from "./loading-icon";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1),
});

type ApiKeyAddProps = {
  onKeyCreated?: (key: string) => void;
};

export function ApiKeyAdd({ onKeyCreated }: ApiKeyAddProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "My API Key",
    },
  });

  const [apiKey, setAPIKey] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setAPIKey(null);
      form.reset({ name: "My API Key" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="mr-1 h-4 w-4" />
          Add Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              const response = await addNewAPIKey(data.name);
              setAPIKey(response.key);
              if (onKeyCreated) {
                onKeyCreated(response.key);
              }
            })}
          >
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create API Key for workflow upload
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {apiKey && (
                <FormItem>
                  <FormLabel>API Key (Copy the API key now)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input readOnly value={apiKey} />
                    </FormControl>
                    <CopyButton text={apiKey} className="" />
                  </div>
                </FormItem>
              )}
            </div>
            <DialogFooter>
              {apiKey ? (
                <Button
                  className="flex gap-2"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    setAPIKey(null);
                    form.reset({ name: "My API Key" });
                  }}
                >
                  Close {form.formState.isSubmitting && <LoadingIcon />}
                </Button>
              ) : (
                <Button
                  className="flex gap-2"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  Create {form.formState.isSubmitting && <LoadingIcon />}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
