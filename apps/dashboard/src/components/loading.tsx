import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';
import { Spinner } from './ui/spinner';

export function Loading({ description }: { description?: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Spinner className="size-10" />
        </EmptyMedia>
        <EmptyTitle>Loading</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}
