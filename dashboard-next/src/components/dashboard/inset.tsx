import { Separator } from '../ui/separator';
import { SidebarInset, SidebarTrigger } from '../ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  title: string;
  href: string;
}

interface DashboardInsetProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

function BreadcrumbNavigation({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbItem[];
}) {
  const pathname = usePathname();

  return (
    <>
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => {
            const isLastItem = index === breadcrumbs.length - 1;
            const showSeparator = !isLastItem;
            const isActive = pathname === breadcrumb.href;

            return (
              <Fragment key={`${breadcrumb.href}-${index}`}>
                <BreadcrumbItem
                  className={cn(!isLastItem && 'hidden md:block')}
                >
                  {isActive ? (
                    <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {showSeparator && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

export default function DashboardInset({
  children,
  breadcrumbs,
}: DashboardInsetProps) {
  const hasBreadcrumbs = breadcrumbs?.length;

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:h-14">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          {hasBreadcrumbs && <BreadcrumbNavigation breadcrumbs={breadcrumbs} />}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </SidebarInset>
  );
}
