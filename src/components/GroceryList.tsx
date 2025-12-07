interface Item {
  id: number;
  name: string;
  qty: number;
  expiry: string;
}

interface Props {
  groceryList: Item[];
}

function GroceryList({ groceryList }: Props) {
  return (
    <ul className="space-y-2 w-full">
      {groceryList.map((item) => (
        <li key={item.id} className="flex flex-col w-full border-gray-200 border rounded-xl py-1 px-4 shrink-0 gap-2">
          <span className="font-medium text-gray-800 text-sm">{item.name}</span>
          <span className="font-medium text-gray-600 text-sm">Qty: {item.qty}</span>
          <span className="text-gray-600 text-sm">{item.expiry && item.expiry.trim() ? `Expires: ${item.expiry}` : 'No expire date'}</span>
        </li>
      ))}
    </ul>
  );
}

export default GroceryList;