"use client";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center p-4 max-w-lg mx-auto mt-8 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-600">{message}</p>
      <p className="text-sm text-gray-600 mt-2">Prova a modificare i termini di ricerca o riprova più tardi.</p>
    </div>
  );
}