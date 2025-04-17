import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CreateDocumentForm } from '@/features/documents/components/CreateDocumentForm';
import { useModal } from '@/hooks/useModal';

export const Header = () => {
  const navigate = useNavigate();
  const createDocModal = useModal(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Поиск документов:', searchQuery);
    // Implement search functionality
  };

  const handleCreateDocument = () => {
    createDocModal.open();
  };

  const handleCreateDocumentSuccess = () => {
    createDocModal.close();
    navigate('/documents');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 py-3 px-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-blue-400">Электронный документооборот</h1>

      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              id="searchInput"
              placeholder="Поиск документов..."
              className="bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-400" />
          </div>
        </form>

        <Button
          id="createDocButton"
          onClick={handleCreateDocument}
          icon={<i className="fas fa-plus" />}
        >
          Создать документ
        </Button>
      </div>

      {/* Create Document Modal */}
      <Modal
        isOpen={createDocModal.isOpen}
        onClose={createDocModal.close}
        title="Создать документ"
      >
        <CreateDocumentForm
          onSuccess={handleCreateDocumentSuccess}
          onCancel={createDocModal.close}
        />
      </Modal>
    </header>
  );
};
