import { useState } from 'react';
import { FolderPlus, Folder, Plus, Trash2, MoreVertical, Download } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { downloadVault } from '../utils/download';

const VaultSelector = () => {
  const { vaults, activeVault, setActiveVault, createVault, deleteVault, notes } = useNotes();
  const [showCreate, setShowCreate] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [showOptions, setShowOptions] = useState(null);

  const handleCreate = async () => {
    if (!vaultName.trim()) return;
    await createVault(vaultName.trim());
    setVaultName('');
    setShowCreate(false);
  };

  const handleDelete = async (vaultId, e) => {
    e.stopPropagation();
    if (confirm('Delete this vault?')) {
      await deleteVault(vaultId);
    }
    setShowOptions(null);
  };

  const handleDownloadClick = (vault) => {
    if (vault.id === activeVault || vault.id === 'default') {
      if (!notes || notes.length === 0) {
        alert('No notes in this vault');
        return;
      }
      downloadVault(notes, vault.name);
    }
    setShowOptions(null);
  };

  return (
    <div className="vault-selector">
      <div className="vault-list">
        {vaults.map(vault => (
          <div
            key={vault.id}
            className={`vault-item ${activeVault === vault.id ? 'active' : ''}`}
            onClick={() => setActiveVault(vault.id)}
          >
            <Folder size={16} />
            <span className="vault-name">
              {vault.id === 'default' ? 'All Notes' : vault.name}
            </span>
            {vaults.length > 1 && vault.id !== 'default' && (
              <button 
                className="vault-options"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(showOptions === vault.id ? null : vault.id);
                }}
              >
                <MoreVertical size={14} />
              </button>
            )}
            {showOptions === vault.id && (
              <div className="vault-menu" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleDownloadClick(vault)}>
                  <Download size={14} />
                  Download
                </button>
                <button onClick={(e) => handleDelete(vault.id, e)}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate ? (
        <div className="vault-create">
          <input
            type="text"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            placeholder="Vault name..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate}>
            <Plus size={16} />
          </button>
          <button onClick={() => setShowCreate(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="add-vault-btn" onClick={() => setShowCreate(true)}>
          <FolderPlus size={16} />
          New Vault
        </button>
      )}
    </div>
  );
};

export default VaultSelector;