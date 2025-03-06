import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpandableText } from "../expantable-text";
import { ImageFallback } from "../image-fallback";
import { CodeBlock } from "../ui/code-blocks";

export function RunInputs({
  run,
}: {
  run: any;
}) {
  return (
    <>
      {run.workflow_inputs && (
        <div className="flex flex-col gap-4">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] px-1">Name</TableHead>
                <TableHead className="px-1">Input</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(run.workflow_inputs).map(([key, data]) => {
                return (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      <ImageFallback
                        src={String(data)}
                        alt={key}
                        fallback={<ExpandableText text={String(data)} />}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <CodeBlock
            code={JSON.stringify(run.workflow_inputs, null, 2)}
            className="text-2xs"
            lang="json"
          />
        </div>
      )}
    </>
  );
}
