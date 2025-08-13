import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Save,
  X
} from 'lucide-react';
import {
  useGetAllNoticesQuery,
  useDeleteNoticeMutation,
  useUpdateNoticeMutation
} from '../../../services/noticeService';
import { useNavigate } from 'react-router-dom';


const NoticeList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  // Form state for editing
  const [editForm, setEditForm] = useState({
    content: '',
    status: 'draft'
  });

  // RTK Query hooks
  const { 
    data: noticesResponse, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useGetAllNoticesQuery({
    page: currentPage,
    limit: 10,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm
  });
//   console.log('Notices Response:', noticesResponse);
  const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();
  const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();

  const notices = noticesResponse?.data?.notices || [];
  const pagination = noticesResponse?.data?.pagination || {};

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setEditForm({
      content: notice.content || '',
      status: notice.status || 'draft'
    });
    setShowEditModal(true);
  };

  const handleDelete = async (noticeId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteNotice(noticeId).unwrap();
        console.log('Notice deleted successfully');
      } catch (error) {
        console.error('Failed to delete notice:', error);
        alert('Failed to delete notice. Please try again.');
      }
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.content.trim()) {
      alert('Content is required');
      return;
    }

    try {
      await updateNotice({
        id: editingNotice._id,
        content: editForm.content.trim(),
        status: editForm.status
      }).unwrap();
      
      setShowEditModal(false);
      setEditingNotice(null);
      console.log('Notice updated successfully');
    } catch (error) {
      console.error('Failed to update notice:', error);
      alert('Failed to update notice. Please try again.');
    }
  };
  const createNotice = () => {
    navigate('/notice/create');
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingNotice(null);
    setEditForm({ content: '', status: 'draft' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const EditModal = () => {
    if (!showEditModal || !editingNotice) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Notice
            </h2>
            <button
              onClick={handleCloseEditModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                placeholder="Enter notice content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating || !editForm.content.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isUpdating ? 'Updating...' : 'Update Notice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading notices...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load notices</h3>
        <p className="text-gray-600 mb-4">Please try again later</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Notice Management
            </h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium" onClick={createNotice}>
              <Plus className="w-4 h-4" />
              Add Notice
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notice List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {notices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all' || searchTerm
                  ? 'Try adjusting your filters to see more notices.'
                  : 'Create your first notice to get started.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Notice</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-4">Created</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {notices.map((notice: any) => (
                  <div key={notice._id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="col-span-4">
                      <div className="flex flex-col">                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notice.content.length > 100 
                            ? `${notice.content.substring(0, 100)}...` 
                            : notice.content}
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-start">
                      {getStatusBadge(notice.status)}
                    </div>
                    
                    
                    
                    <div className="col-span-4 flex items-start">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-start gap-2">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        disabled={isUpdating}
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id, notice.title || 'Untitled Notice')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white px-4 py-3 rounded-lg border">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages} 
              ({pagination.totalCount} total notices)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <EditModal />
    </>
  );
};

export default NoticeList;