import { useNavigate } from 'react-router-dom';
import { CreateDocumentForm } from '../components/CreateDocumentForm';
import { Button } from '@/components/ui/Button';

const CreateDocument = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/documents');
  };

  const handleSuccess = () => {
    navigate('/documents');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-200">Создание документа</h1>
        <Button
          variant="secondary"
          icon={<i className="fas fa-arrow-left" />}
          onClick={handleCancel}
        >
          Назад к списку
        </Button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <CreateDocumentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default CreateDocument;
