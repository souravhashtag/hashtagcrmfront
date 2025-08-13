import React, { useState } from "react";
import { FileText, Save, Eye, X, Loader2, ArrowLeft } from "lucide-react";
import { useCreateNoticeMutation } from "../../../services/noticeService";
import { useNavigate } from 'react-router-dom';

const NoticeCreate: React.FC = () => {
  const [formData, setFormData] = useState({
    content: "",
    status: "published",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [createNotice, { isLoading }] = useCreateNoticeMutation();
  const navigate = useNavigate();
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createNotice({
        content: formData.content.trim(),
        status: formData.status,
      }).unwrap();

      // Reset form
      setFormData({
        content: "",
        status: "published",
      });

      alert("Notice created successfully!");
    } catch (error) {
      console.error("Failed to create notice:", error);
      alert("Failed to create notice. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate('/notice');
  };

  return (
    <>
      <div className="mx-auto bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Create New Notice
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notice *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder="Write your notice content here. Include all relevant details and information..."
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {formData.status === "draft" &&
                "Draft notices are not visible to users"}
              {formData.status === "published" &&
                "Published notices are visible to all users"}
              {formData.status === "archived" &&
                "Archived notices are hidden but preserved"}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">* Required fields</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !formData.content.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isLoading ? "Creating..." : "Create Notice"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default NoticeCreate;
