import { Card, CardContent } from "@conntrack/ui/shadcn";
import {
    Briefcase,
    Building2,
    Loader2,
    MapPin,
    Phone,
    ShieldCheck,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../config/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/logistics/profile');
                setProfile(data);
            } catch (err) {
                console.error('Failed to load profile', err);
                setError(err.response?.data?.message || 'Unable to load your profile right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm text-slate-600">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-sm font-semibold">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-8 max-w-5xl mx-auto min-h-screen flex items-center justify-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 shadow-sm">
                    {error || 'Profile not available.'}
                </div>
            </div>
        );
    }

    const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Logistics Staff';

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/30 min-h-screen">
            <h1 className="text-3xl font-bold text-[#052659]">Logistics Profile</h1>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="bg-blue-50 p-6 rounded-2xl">
                        <User size={42} className="text-[#052659]" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-slate-900">{fullName}</h2>
                            <ShieldCheck size={24} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium text-sm">
                            <div className="flex items-center gap-2">
                                <Briefcase size={18} />
                                <span>{profile.position || 'Logistics Handler'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-nowrap">
                                <Building2 size={18} />
                                <span>{profile.role || 'logistics'}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <User className="text-[#052659]" size={24} />
                            <h3 className="text-xl font-bold text-slate-800">Essential Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            <InfoField label="FIRST NAME" value={profile.first_name || 'N/A'} />
                            <InfoField label="LAST NAME" value={profile.last_name || 'N/A'} />
                            <InfoField label="EMPLOYEE ID" value={profile.employee_id || 'N/A'} />
                            <InfoField label="ROLE" value={profile.role || 'N/A'} />
                            <div className="col-span-2">
                                <InfoField label="CONTACT NUMBER" value={profile.contact_number || 'N/A'} icon={<Phone size={14} />} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <MapPin className="text-[#052659]" size={24} />
                            <h3 className="text-xl font-bold text-slate-800">Work Details</h3>
                        </div>

                        <div className="space-y-6">
                            <InfoField label="POSITION" value={profile.position || 'N/A'} icon={<Briefcase size={14} />} />
                            <InfoField label="ADDRESS" value={profile.address || 'N/A'} icon={<MapPin size={14} />} />
                            <InfoField label="STATUS" value={profile.status || 'Active'} icon={<ShieldCheck size={14} />} />
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">DISPLAY NAME</p>
                                <p className="text-sm font-bold text-slate-700">{fullName}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => (
    <div className="space-y-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
            {icon && <span className="text-slate-500">{icon}</span>}
            <p className="text-sm font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

export default Profile;
