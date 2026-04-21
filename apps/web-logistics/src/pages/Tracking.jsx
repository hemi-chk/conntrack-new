import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Search, MapPin } from "lucide-react"

export default function Tracking() {
    const [trackingId, setTrackingId] = useState("")
    const [data, setData] = useState(null)

    // 🔹 Dummy tracking data
    const mockData = {
        id: "TRK12345",
        status: "In Transit",
        location: "Colombo Port",
        vehicle: "Truck B",
        driver: "Kasun",
    }

    const handleTrack = () => {
        // simulate API
        if (trackingId) {
            setData(mockData)
        }
    }

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Track Shipment</h1>
                <p className="text-sm text-muted-foreground">
                    Enter tracking ID to view shipment status
                </p>
            </div>

            {/* Search Box */}
            <Card>
                <CardContent className="flex gap-3 p-4">
                    <Input
                        placeholder="Enter Tracking ID..."
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                    />
                    <Button onClick={handleTrack}>
                        <Search className="h-4 w-4 mr-2" />
                        Track
                    </Button>
                </CardContent>
            </Card>

            {/* Result */}
            {data && (
                <Card>
                    <CardHeader>
                        <CardTitle>Shipment Details</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        {/* ID + Status */}
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">#{data.id}</span>
                            <Badge>{data.status}</Badge>
                        </div>

                        {/* Details */}
                        <div className="grid gap-3 sm:grid-cols-2">

                            <div className="flex items-center gap-2 text-sm">
                                <Truck className="h-4 w-4 text-primary" />
                                {data.vehicle}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary" />
                                {data.location}
                            </div>

                            <div className="text-sm">
                                <span className="text-muted-foreground">Driver:</span>{" "}
                                {data.driver}
                            </div>

                        </div>

                    </CardContent>
                </Card>
            )}
        </div>
    )
}