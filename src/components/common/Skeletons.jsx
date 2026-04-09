export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-gray-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}

export function WardrobeSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
            </div>
        </div>
    );
}

export function TableSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4 animate-pulse mt-8">
            <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-lg w-full"></div>
                ))}
            </div>
        </div>
    );
}

export function AdminSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 md:px-0 mt-8">
            <div className="h-28 bg-gray-200 rounded-3xl animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="h-96 bg-gray-200 rounded-3xl animate-pulse"></div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <TableSkeleton />
                    <TableSkeleton />
                </div>
            </div>
        </div>
    );
}
