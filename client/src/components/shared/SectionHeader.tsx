import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <div className="h-6 w-1 bg-primary rounded-full" />
        {title}
      </h2>
      {link && (
        <Link href={link}>
          <a className="text-sm text-primary hover:text-white transition-colors flex items-center gap-1 font-medium">
            Ver tudo <ChevronRight className="w-4 h-4" />
          </a>
        </Link>
      )}
    </div>
  );
}
