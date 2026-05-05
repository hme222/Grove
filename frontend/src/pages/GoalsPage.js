import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Check } from 'lucide-react';
import { toast } from 'sonner';

const GOAL_TYPES = [
  { value: 'streak_days', label: 'Streak Days' },
  { value: 'care_logs_count', label: 'Care Logs Count' },
  { value: 'plant_count', label: 'Plant Count' },
  { value: 'custom', label: 'Custom Goal' },
];

export default function GoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'streak_days',
    target_value: 7,
  });

  const fetchGoals = async () => {
    try {
      const res = await goalAPI.getAll();
      setGoals(res.data);
    } catch (e) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.target_value) {
      toast.error('Title and target value are required');
      return;
    }
    setCreating(true);
    try {
      await goalAPI.create(formData);
      toast.success('Goal created!');
      setShowCreate(false);
      setFormData({ title: '', description: '', goal_type: 'streak_days', target_value: 7 });
      fetchGoals();
    } catch (e) {
      toast.error('Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await goalAPI.complete(id);
      toast.success('Goal completed! 🎉');
      fetchGoals();
    } catch (e) {
      toast.error('Failed to complete goal');
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div>
      <PageHeader
        title="Goals"
        count={activeGoals.length}
        rightContent={
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button
                data-testid="goals-create-button"
                className="rounded-full w-9 h-9 bg-[#1C2E10] text-[#F5F0E8] flex items-center justify-center hover:bg-[#2D5016] transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#F5F0E8]">
              <DialogHeader>
                <DialogTitle className="font-plant text-[#1C2E10]">Create Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#1A1A17] mb-2 block">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 30-Day Streak"
                    className="bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8]"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#1A1A17] mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional details"
                    className="bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8]"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#1A1A17] mb-2 block">
                    Goal Type
                  </label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
                  >
                    <SelectTrigger className="bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#1A1A17] mb-2 block">
                    Target Value
                  </label>
                  <Input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
                    className="bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8]"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full rounded-[2px] font-[Georgia] uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#1C2E10] text-[#F5F0E8]"
                >
                  {creating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
          <EmptyState config={EMPTY_STATES.goals_none} />
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div>
                <h2 className="font-plant text-[#1C2E10] text-sm mb-3">Active Goals</h2>
                <div className="space-y-2">
                  {activeGoals.map(goal => (
                    <div
                      key={goal.id}
                      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4"
                      data-testid="goal-card"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="font-plant text-[#1C2E10] text-base">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-sm text-[#2B2B26] mt-1">{goal.description}</p>
                          )}
                        </div>
                        <Target className="h-5 w-5 text-[#3B6D11]" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#2B2B26]">Progress</span>
                          <span className="text-[#3B6D11]">
                            {goal.current_value} / {goal.target_value}
                          </span>
                        </div>
                        <div className="w-full bg-[#EAF3DE] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#3B6D11] h-full transition-all duration-300"
                            style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      {goal.current_value >= goal.target_value && (
                        <Button
                          onClick={() => handleComplete(goal.id)}
                          className="w-full mt-3 rounded-[2px] font-[Georgia] uppercase tracking-[0.08em] text-xs px-4 py-2 bg-[#3B6D11] text-[#F5F0E8]"
                          data-testid="goal-complete-button"
                        >
                          <Check className="h-3.5 w-3.5 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div>
                <h2 className="font-plant text-[#1C2E10] text-sm mb-3">Completed Goals</h2>
                <div className="space-y-2">
                  {completedGoals.map(goal => (
                    <div
                      key={goal.id}
                      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4 opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-[#3B6D11]" />
                        <h3 className="font-plant text-[#1C2E10] text-base">{goal.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
