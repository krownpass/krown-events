
// Mock data for the Krown Event Organizers Admin Panel

export interface Event {
    id: string;
    name: string;
    coverImage: string;
    date: string;
    time: string;
    status: 'draft' | 'scheduled' | 'live' | 'locked' | 'completed';
    type: 'open' | 'private' | 'invite-only' | 'mystery' | 'paid';
    capacity: number;
    confirmed: number;
    waitlist: number;
    revenue: number;
    views: number;
    location: string;
    locationRevealed: boolean;
    ticketingEnabled: boolean;
}

export interface Registration {
    id: string;
    name: string;
    username: string;
    email: string;
    status: 'confirmed' | 'pending' | 'rejected' | 'checked-in';
    registeredAt: string;
    ticketTier: string;
    quantity: number;
    avatar: string;
}

export interface WaitlistEntry {
    id: string;
    name: string;
    username: string;
    position: number;
    requestedAt: string;
    avatar: string;
}

export interface Invite {
    id: string;
    code: string;
    createdBy: string;
    status: 'active' | 'used' | 'expired';
    usedBy: string | null;
    createdAt: string;
    expiresAt: string;
}

export interface TicketTier {
    id: string;
    name: string;
    price: number;
    capacity: number;
    sold: number;
    salesStart: string;
    salesEnd: string;
    status: 'active' | 'paused' | 'sold-out';
}

export interface Broadcast {
    id: string;
    title: string;
    body: string;
    sentAt: string;
    audience: string;
    opens: number;
    clicks: number;
    status: 'sent' | 'scheduled' | 'draft';
}

export const mockEvents: Event[] = [
    {
        id: '1',
        name: 'Weekend Run 2024',
        coverImage: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
        date: '2024-02-15',
        time: '06:00 AM',
        status: 'live',
        type: 'paid',
        capacity: 500,
        confirmed: 423,
        waitlist: 47,
        revenue: 84600,
        views: 2341,
        location: 'Marine Drive, Mumbai',
        locationRevealed: true,
        ticketingEnabled: true,
    },
    {
        id: '2',
        name: 'Sunset Yoga Retreat',
        coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
        date: '2024-02-20',
        time: '05:30 PM',
        status: 'scheduled',
        type: 'private',
        capacity: 50,
        confirmed: 38,
        waitlist: 12,
        revenue: 19000,
        views: 567,
        location: 'To be revealed',
        locationRevealed: false,
        ticketingEnabled: true,
    },
    {
        id: '3',
        name: 'Tech Meetup Q1',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        date: '2024-03-01',
        time: '07:00 PM',
        status: 'draft',
        type: 'open',
        capacity: 200,
        confirmed: 0,
        waitlist: 0,
        revenue: 0,
        views: 0,
        location: 'WeWork BKC',
        locationRevealed: true,
        ticketingEnabled: false,
    },
    {
        id: '4',
        name: 'Mystery Night Party',
        coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        date: '2024-02-28',
        time: '10:00 PM',
        status: 'scheduled',
        type: 'mystery',
        capacity: 150,
        confirmed: 134,
        waitlist: 28,
        revenue: 67000,
        views: 1203,
        location: 'Secret Location',
        locationRevealed: false,
        ticketingEnabled: true,
    },
    {
        id: '5',
        name: 'Diwali Bash 2023',
        coverImage: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800',
        date: '2023-11-12',
        time: '08:00 PM',
        status: 'completed',
        type: 'invite-only',
        capacity: 300,
        confirmed: 287,
        waitlist: 0,
        revenue: 143500,
        views: 4521,
        location: 'Taj Lands End',
        locationRevealed: true,
        ticketingEnabled: true,
    },
];

export const mockRegistrations: Registration[] = [
    {
        id: '1',
        name: 'Arjun Kapoor',
        username: '@arjunk',
        email: 'arjun@email.com',
        status: 'confirmed',
        registeredAt: '2024-02-10 14:30',
        ticketTier: 'VIP',
        quantity: 2,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
    },
    {
        id: '2',
        name: 'Priya Sharma',
        username: '@priyas',
        email: 'priya@email.com',
        status: 'pending',
        registeredAt: '2024-02-11 09:15',
        ticketTier: 'Early Bird',
        quantity: 1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    },
    {
        id: '3',
        name: 'Rahul Mehta',
        username: '@rahulm',
        email: 'rahul@email.com',
        status: 'checked-in',
        registeredAt: '2024-02-09 16:45',
        ticketTier: 'Regular',
        quantity: 3,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    },
    {
        id: '4',
        name: 'Sneha Patel',
        username: '@snehap',
        email: 'sneha@email.com',
        status: 'confirmed',
        registeredAt: '2024-02-12 11:20',
        ticketTier: 'VIP',
        quantity: 1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
    },
    {
        id: '5',
        name: 'Vikram Singh',
        username: '@vikrams',
        email: 'vikram@email.com',
        status: 'rejected',
        registeredAt: '2024-02-08 08:00',
        ticketTier: 'Regular',
        quantity: 1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram',
    },
];

export const mockWaitlist: WaitlistEntry[] = [
    {
        id: '1',
        name: 'Amit Kumar',
        username: '@amitk',
        position: 1,
        requestedAt: '2024-02-12 10:00',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
    },
    {
        id: '2',
        name: 'Neha Gupta',
        username: '@nehag',
        position: 2,
        requestedAt: '2024-02-12 10:15',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha',
    },
    {
        id: '3',
        name: 'Rohan Das',
        username: '@rohand',
        position: 3,
        requestedAt: '2024-02-12 10:30',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan',
    },
];

export const mockInvites: Invite[] = [
    {
        id: '1',
        code: 'KROWN-VIP-2024',
        createdBy: 'Admin',
        status: 'active',
        usedBy: null,
        createdAt: '2024-02-10',
        expiresAt: '2024-02-28',
    },
    {
        id: '2',
        code: 'FRIEND-ARJUN-01',
        createdBy: 'Arjun Kapoor',
        status: 'used',
        usedBy: 'Priya Sharma',
        createdAt: '2024-02-08',
        expiresAt: '2024-02-15',
    },
    {
        id: '3',
        code: 'EARLY-ACCESS-X1',
        createdBy: 'Admin',
        status: 'expired',
        usedBy: null,
        createdAt: '2024-01-15',
        expiresAt: '2024-02-01',
    },
];

export const mockTicketTiers: TicketTier[] = [
    {
        id: '1',
        name: 'Early Bird',
        price: 150,
        capacity: 100,
        sold: 100,
        salesStart: '2024-01-15 00:00',
        salesEnd: '2024-02-01 23:59',
        status: 'sold-out',
    },
    {
        id: '2',
        name: 'Regular',
        price: 200,
        capacity: 300,
        sold: 248,
        salesStart: '2024-02-01 00:00',
        salesEnd: '2024-02-14 23:59',
        status: 'active',
    },
    {
        id: '3',
        name: 'VIP',
        price: 500,
        capacity: 100,
        sold: 75,
        salesStart: '2024-01-15 00:00',
        salesEnd: '2024-02-14 23:59',
        status: 'active',
    },
];

export const mockBroadcasts: Broadcast[] = [
    {
        id: '1',
        title: 'Event Reminder - Tomorrow!',
        body: 'Don\'t forget! Weekend Run 2024 is happening tomorrow at 6 AM...',
        sentAt: '2024-02-14 18:00',
        audience: 'All Confirmed',
        opens: 387,
        clicks: 156,
        status: 'sent',
    },
    {
        id: '2',
        title: 'VIP Exclusive Update',
        body: 'Special announcement for our VIP ticket holders...',
        sentAt: '2024-02-13 12:00',
        audience: 'VIP Only',
        opens: 68,
        clicks: 45,
        status: 'sent',
    },
    {
        id: '3',
        title: 'Last Few Tickets!',
        body: 'Only 25 Regular tickets remaining...',
        sentAt: '',
        audience: 'Waitlist',
        opens: 0,
        clicks: 0,
        status: 'scheduled',
    },
];

export const mockStats = {
    followers: 12450,
    followersGrowth: 234,
    upcomingEvents: 4,
    nextEventName: 'Weekend Run 2024',
    registrationsThisWeek: 156,
    revenueThisWeek: 78400,
    totalRevenue: 314100,
    totalEvents: 28,
    repeatAttendees: 3420,
};

export const mockUrgentTasks = [
    { id: '1', type: 'approval', message: '12 pending approvals', action: 'Review Requests' },
    { id: '2', type: 'waitlist', message: 'Waitlist active (47 waiting)', action: 'Manage Waitlist' },
    { id: '3', type: 'reveal', message: 'Location reveal in 2 hours', action: 'Reveal Controls' },
    { id: '4', type: 'ticket', message: 'VIP tier 80% sold', action: 'Adjust Tier' },
    { id: '5', type: 'schedule', message: 'Broadcast scheduled for 6 PM', action: 'View Schedule' },
];
