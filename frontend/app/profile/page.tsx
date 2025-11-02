"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import {
  User,
  Edit3,
  Star,
  MapPin,
  Mail,
  Calendar,
  Briefcase,
  DollarSign,
  Award,
  ExternalLink,
  Settings,
  Eye,
  Plus,
  Trash2,
  Save,
  X,
} from "lucide-react";

// Types for our profile data
interface Skill {
  id: number;
  name: string;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  experience_years: number;
}

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  project_url?: string;
  created_at: string;
}

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  hourly_rate?: number;
  skills: Skill[];
  portfolio: PortfolioItem[];
  user_stats: {
    total_projects: number;
    completed_projects: number;
    average_rating: number;
    total_earnings: number;
    completion_rate: number;
  };
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState({
    name: "",
    proficiency: "BEGINNER" as const,
    experience_years: 1,
  });
  const [newPortfolio, setNewPortfolio] = useState({
    title: "",
    description: "",
    technologies: "",
    project_url: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    hourly_rate: 0,
  });

  // Fetch profile data from backend
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("http://localhost:5000/api/users/me", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfileData(data);
      setEditForm({
        name: data.name || "",
        bio: data.bio || "",
        location: data.location || "",
        hourly_rate: data.hourly_rate || 0,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist, user needs to complete setup
      if (!profileData) {
        setIsEditing(true);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // API functions
  const updateProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const addSkill = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/me/skills",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(newSkill),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add skill");
      }

      await fetchProfile();
      setNewSkill({ name: "", proficiency: "BEGINNER", experience_years: 1 });
    } catch (error) {
      console.error("Error adding skill:", error);
      alert("Failed to add skill");
    }
  };

  const deleteSkill = async (skillId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/me/skills/${skillId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete skill");
      }

      await fetchProfile();
    } catch (error) {
      console.error("Error deleting skill:", error);
      alert("Failed to delete skill");
    }
  };

  const addPortfolioItem = async () => {
    // TODO: Portfolio functionality not yet implemented in consolidated users module
    alert("Portfolio functionality will be available soon!");
    return;
    /*
    try {
      const portfolioData = {
        ...newPortfolio,
        technologies: newPortfolio.technologies
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      };

      const response = await fetch(
        "http://localhost:5000/api/users/me/portfolio",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(portfolioData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add portfolio item");
      }

      await fetchProfile();
      setNewPortfolio({
        title: "",
        description: "",
        technologies: "",
        project_url: "",
      });
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      alert("Failed to add portfolio item");
    }
    */
  };

  const deletePortfolioItem = async (itemId: number) => {
    // TODO: Portfolio functionality not yet implemented in consolidated users module
    alert("Portfolio functionality will be available soon!");
    return;
    /*
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/me/portfolio/${itemId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete portfolio item");
      }

      await fetchProfile();
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      alert("Failed to delete portfolio item");
    }
    */
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting in useEffect
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Profile not found. Please complete your profile setup.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Setup Profile
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {profileData.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-3xl font-bold bg-gray-700 text-white rounded px-3 py-1"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="block bg-gray-700 text-gray-300 rounded px-3 py-1"
                    placeholder="Location"
                  />
                  <input
                    type="number"
                    value={editForm.hourly_rate}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        hourly_rate: Number(e.target.value),
                      })
                    }
                    className="block bg-gray-700 text-gray-300 rounded px-3 py-1"
                    placeholder="Hourly Rate"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profileData.name}
                  </h1>
                  <p className="text-gray-400 mb-2">
                    {profileData.role.toLowerCase()}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profileData.location || "Location not set"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(profileData.created_at)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={updateProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
                <Link
                  href="/profile/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {profileData.user_stats.completed_projects}
            </div>
            <div className="text-sm text-gray-400">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
              {profileData.user_stats.average_rating.toFixed(1)}
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
            <div className="text-sm text-gray-400">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              ${profileData.hourly_rate || 0}
            </div>
            <div className="text-sm text-gray-400">Hourly Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {profileData.skills.length}
            </div>
            <div className="text-sm text-gray-400">Skills</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">About</h2>
            {isEditing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                className="w-full h-32 bg-gray-700 text-gray-300 rounded px-3 py-2 resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-300 leading-relaxed">
                {profileData.bio || "No bio provided yet."}
              </p>
            )}
          </div>

          {/* Portfolio */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Portfolio</h2>
              <button
                onClick={() =>
                  setEditingPortfolio(editingPortfolio === -1 ? null : -1)
                }
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
            </div>

            {/* Add new portfolio item */}
            {editingPortfolio === -1 && (
              <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="grid gap-4">
                  <input
                    type="text"
                    value={newPortfolio.title}
                    onChange={(e) =>
                      setNewPortfolio({
                        ...newPortfolio,
                        title: e.target.value,
                      })
                    }
                    className="bg-gray-700 text-white rounded px-3 py-2"
                    placeholder="Project Title"
                  />
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) =>
                      setNewPortfolio({
                        ...newPortfolio,
                        description: e.target.value,
                      })
                    }
                    className="bg-gray-700 text-white rounded px-3 py-2 h-20 resize-none"
                    placeholder="Project Description"
                  />
                  <input
                    type="text"
                    value={newPortfolio.technologies}
                    onChange={(e) =>
                      setNewPortfolio({
                        ...newPortfolio,
                        technologies: e.target.value,
                      })
                    }
                    className="bg-gray-700 text-white rounded px-3 py-2"
                    placeholder="Technologies (comma-separated)"
                  />
                  <input
                    type="url"
                    value={newPortfolio.project_url}
                    onChange={(e) =>
                      setNewPortfolio({
                        ...newPortfolio,
                        project_url: e.target.value,
                      })
                    }
                    className="bg-gray-700 text-white rounded px-3 py-2"
                    placeholder="Project URL (optional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addPortfolioItem}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      Add Project
                    </button>
                    <button
                      onClick={() => setEditingPortfolio(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {profileData.portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-700/50 rounded-lg overflow-hidden"
                >
                  <div className="h-48 bg-gray-600 flex items-center justify-center">
                    <span className="text-gray-400">Portfolio Image</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <button
                        onClick={() => deletePortfolioItem(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Project
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {profileData.portfolio.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No portfolio projects yet.</p>
                <p className="text-sm">
                  Add your first project to showcase your work!
                </p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Statistics
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Projects</span>
                  <span className="text-white font-semibold">
                    {profileData.user_stats.total_projects}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completion Rate</span>
                  <span className="text-white font-semibold">
                    {profileData.user_stats.completion_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Earnings</span>
                  <span className="text-white font-semibold">
                    ${profileData.user_stats.total_earnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Rating</span>
                  <span className="text-white font-semibold">
                    {profileData.user_stats.average_rating.toFixed(1)}/5.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">
                  ${profileData.hourly_rate || 0}/hour
                </span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Skills</h3>
              <button
                onClick={() => setEditingSkill(editingSkill === -1 ? null : -1)}
                className="text-blue-400 hover:text-blue-300"
                title="Add new skill"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add new skill */}
            {editingSkill === -1 && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded border border-gray-600">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, name: e.target.value })
                    }
                    className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    placeholder="Skill name"
                  />
                  <select
                    value={newSkill.proficiency}
                    onChange={(e) =>
                      setNewSkill({
                        ...newSkill,
                        proficiency: e.target.value as any,
                      })
                    }
                    className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    title="Select proficiency level"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newSkill.experience_years}
                    onChange={(e) =>
                      setNewSkill({
                        ...newSkill,
                        experience_years: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    placeholder="Years of experience"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addSkill}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setEditingSkill(null)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {profileData.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between bg-gray-700/30 rounded px-3 py-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {skill.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          skill.proficiency === "EXPERT"
                            ? "bg-purple-600/20 text-purple-400"
                            : skill.proficiency === "ADVANCED"
                            ? "bg-blue-600/20 text-blue-400"
                            : skill.proficiency === "INTERMEDIATE"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {skill.proficiency}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {skill.experience_years} years
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete skill"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {profileData.skills.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                No skills added yet.
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/opportunities"
                className="w-full flex items-center gap-2 p-3 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                <span>Find Work</span>
              </Link>

              <Link
                href="/projects"
                className="w-full flex items-center gap-2 p-3 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>My Projects</span>
              </Link>

              <Link
                href="/networking"
                className="w-full flex items-center gap-2 p-3 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Network</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
