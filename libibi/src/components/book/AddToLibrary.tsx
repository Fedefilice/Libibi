import React from 'react';

interface AddToLibraryProps {
  status: string;
  onStatusChange: (status: string) => void;
  bookPresent: boolean;
  adding: boolean;
  needLoginPrompt: boolean;
  flash: { type: 'success' | 'error'; text: string } | null;
  onAddToLibrary: () => void;
  onRemoveFromLibrary: () => void;
  className?: string;
}

const AddToLibrary: React.FC<AddToLibraryProps> = ({
  status,
  onStatusChange,
  bookPresent,
  adding,
  needLoginPrompt,
  flash,
  onAddToLibrary,
  onRemoveFromLibrary,
  className = ''
}) => {
  return (
    <div className={`w-full max-w-[253px] card ${className}`}>      
      <div className="space-y-4">
        <div>
          <select 
            value={status} 
            onChange={(e) => onStatusChange(e.target.value)} 
            className="form-input text-lg"
          >
            <option value="want_to_read">Voglio leggerlo</option>
            <option value="reading">Sto leggendo</option>
            <option value="finished">Letto</option>
            <option value="abandoned">Abbandonato</option>
          </select>
        </div>

        <div className="pt-2">
          {!bookPresent ? (
            <div className="space-y-3">
              <button 
              onClick={onAddToLibrary} 
              className="btn btn-ghost w-full text-lg py-3 font-medium"
            >
                {adding ? 'Aggiungendo...' : 'Aggiungi alla libreria'}
              </button>
              {needLoginPrompt && (
                <div className="text-center p-3 bg-red-50 border border-red-200 rounded-full">
                  <p className="text-sm text-red-600">
                    Devi essere <a href="/login" className="text-[var(--color-accent)] hover:underline font-medium">loggato</a> per aggiungere un libro alla tua libreria.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onRemoveFromLibrary} 
              className="btn btn-ghost w-full text-lg py-3 font-medium"
            >
              Rimuovi dalla libreria
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToLibrary;