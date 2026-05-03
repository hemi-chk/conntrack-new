import React from 'react';
import {
    Truck,
    MapPin,
    Calendar,
    User,
    Mail,
    Phone,
    Briefcase,
    FileText,
    Globe,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const Profile = () => {
    // Adapted data for a Logistics Handler based on ConnTrack requirements
    const handlerData = {
        companyName: "ConnTrack Logistics Solutions",
        address: "No. 45, Industrial Zone, Colombo 10",
        joinedDate: "12 January 2026",
        registrationNo: "LH-99823",
        tin: "TIN990011223",
        licenseType: "International Freight Forwarder",
        email: "ops@conntrack.lk",
        fleetSize: "25 Vehicles",
        serviceRegion: "Island-wide / South Asia",
        contactPerson: {
            name: "Binuwara",
            position: "Fleet Coordinator",
            email: "binuwara@conntrack.lk",
            phone: "0712345678"
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50/30 min-h-screen">
            <h1 className="text-3xl font-bold text-[#1E40AF]">Logistics Handler Profile</h1>

            {/* --- TOP HEADER CARD --- */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="bg-blue-50 p-6 rounded-2xl">
                        <Truck size={48} className="text-[#1E40AF]" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-slate-900">{handlerData.companyName}</h2>
                            <ShieldCheck size={24} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} />
                                <span>{handlerData.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-nowrap">
                                <Calendar size={18} />
                                <span>Joined {handlerData.joinedDate}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- OPERATIONAL INFORMATION --- */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <FileText className="text-[#1E40AF]" size={24} />
                            <h3 className="text-xl font-bold text-slate-800">Operational Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-y-8">
                            <InfoField label="HANDLER ID" value={handlerData.registrationNo} />
                            <InfoField label="TIN NUMBER" value={handlerData.tin} />
                            <InfoField label="FLEET CAPACITY" value={handlerData.fleetSize} icon={<Truck size={14} />} />
                            <InfoField label="SERVICE REGION" value={handlerData.serviceRegion} icon={<Globe size={14} />} />
                            <div className="col-span-2">
                                <InfoField label="OPERATIONAL EMAIL" value={handlerData.email} isEmail />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- COORDINATOR CONTACT --- */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <User className="text-[#1E40AF]" size={24} />
                            <h3 className="text-xl font-bold text-slate-800">Primary Contact</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-y-8">
                            <InfoField label="COORDINATOR" value={handlerData.contactPerson.name} />
                            <InfoField
                                label="DESIGNATION"
                                value={handlerData.contactPerson.position}
                                icon={<Briefcase size={14} />}
                            />
                            <InfoField
                                label="WORK EMAIL"
                                value={handlerData.contactPerson.email}
                                isEmail
                            />
                            <InfoField
                                label="MOBILE NUMBER"
                                value={handlerData.contactPerson.phone}
                                icon={<Phone size={14} />}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

// Helper component for uniform fields
const InfoField = ({ label, value, isEmail, icon }) => (
    <div className="space-y-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
            {isEmail && <Mail size={14} className="text-slate-500" />}
            {icon && <span className="text-slate-500">{icon}</span>}
            <p className="text-sm font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

export default Profile;