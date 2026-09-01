import { CreateStoreFlow } from '@/components/builder/create-store-flow';

export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create a store</h1>
        <p className="text-muted-foreground text-sm">
          Describe what you want and Xandevo generates a complete storefront definition.
        </p>
      </div>
      <CreateStoreFlow />
    </div>
  );
}
