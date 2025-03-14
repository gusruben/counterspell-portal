import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const port = Number(process.env.API_PORT) || 3000;

const app = express();
app.use(express.json());
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});


// important variables
let lastSwapTime: number = Date.now();


// express stuff
app.get("/", (_req, res) => {
	res.send("<pre>"+atob("CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4tJwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLScKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi0nCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4tJwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLScKICAgICAgICAgICAgICAgICAgLykgICAgICAgICAgICAgICAgICAgICAgICAgLi0nCiAgICAgICAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICAgIC4tJwogICAgICAgICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICAuLScKICAgICAgICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgLi0nCiAgICAgICAgICAgICAgICAgfHwgICAgICAgICAgICAgIC4tJyAgICAgLi0tLS0tLS4KICAgICAgICAgICAgICAgICB8fCAgICAgICAgICAgLi0nICBfXyAgIHwgKm1lb3cqIHwKICAgICAgICAgICAgICAgICB8fCAgICAgICAgLi0nICAgLictL19fIHwgIF8uLS0tJwogICAgICAgICAgICAgICAgIHxgLS0tLS0tLS0tLS0tLScgICAgLyAvLicKICAgICAgICAgICAgICAgICB8KiAgICAgICAgICAgICAgICAgJ3wgLycKICAgICAgICAgICAgICAgICB8ICAgICB8ICAgICAgICAgIGAtLScKICAgICAgICAgICAgICAgLi18IHwgIC9fX19fX19fICAgIHwKICAgICAgICAgICAgLi0nICB8IHwgPCAgICAgICAgYC58fHwgICAgICAgICAgICAgICBfLid8CiAgICAgICAgIC4tJ19fX18gIFxgLmAuICAgICAgIHx8fHwgICAgICAgICAgIF8uLSdfLi18CiAgICAgIC4tJyAgfHwgICBgLS1gLSBgLikuX19fXyB8fHx8ICAgICAgIF8uLSdfLi0nICAgfAogICAuLScgICAgIHx8ICAgICAgICAgICAgICAgICBgYC1gYC0tLl8uLSdfLi0nICAgICAgIHwKLi0nICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgICAgICB8YC0nICAgICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICAgICAgfCB8ICAgICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICAgICAgIHwgfCAgICAgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgICAgICB8IHwgICAgICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICAgICAgfCB8ICAgICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICAgICAgIHwgfCAgICAgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgICAgIHxgLS07fX07LiAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICAgIC4nICBvIH19fX0gICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICAuJyAgICAgIH19fX0gICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICB8ICAgICAgKX19fX19ICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICAgICAgICAnfX19fX0gICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICAgICBMICAgIH19fX19fSAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgICAgfCAgXy59fX19fX0gICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgIC4tJ3wuJy4tYC19fX19fSAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgLicgIHwvfC8gICAgICBgLn19ICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAuJyAvICAgICAgICAgICAgICB9ICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgIC8gIHwgICAgICAgICAgICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAvICAgfCAgICAgICAgICAgfCAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAuJyAgIC4nICAgICAgICAgIHwgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgIC4nICAgLicgIHwgICBgICAgICAgfCAgICAgICB8CmAuICAgICAgICAgfHwgICAgICAgIC4nICAgLicgICAgfCAgICAgICAgICB8ICAgfCAgICApfAogIGAuICAgICAgIHx8ICAgICAuLScgIC4nICAgICAgfCAgICAgICAgICAoICAvICAgLicgfAogICAgYC4gICAgIHx8ICAgXy9fXy4nYCcgICAgICAgIEogICAgICAgICAgSiAvICAgLyAgIHwKICAgICAgYC4gICB8fCAoJykgICAgICAgICAgICAgICB8ICAgICAgICAgICAvICAgLyAgICB8CiAgICAgICAgYC4gfHwgICAgICAgICAgICAgICAgICAgRiAgICAgICAgICA8ICAgLyAgICAgfAogICAgICAgICAgYHx8ICAgICAgICAgICAgICAgICAgIEwgICAgICAgICwvIGAuLyAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICBgLS5fXy4tLS0vJ18vXy8gICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgfCAgICAgICAvLy0nfCAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgIHwgICAgICAvLyAgIHwgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICB8ICAgICAgJyAgICB8ICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgfCAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgIGAtLl9fX19fXy4tJyAgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgfCAgICBGICAgIHwgICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgICggICBKfCAgICBGICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICB8ICAgfHwgICBKICAgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgfCAgIHxKKCAgIEwgICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgIEogICBGfEYgICB8ICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgICAgICB8ICBKIHx8ICAgfCAgICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgICAgICAgICAgfCAgfF98fCAgIEYgICAgICAgICB8CiAgICAgICAgICAgfHwgICAgICAgICAgICAgICAgICAgX0YgIEogYHwgIEogICAgICAgICAgfAogICAgICAgICAgIHx8ICAgICAgICAgICAgICAgXy4tJy9fLicgKSB8ICB8YC4gICAgICAgIHwKICAgICAgICAgICB8fCAgICAgICAgICAgXy4tJyAuLScgIC8vICB8ICB8LiBgLiAgICAgIHwKICAgICAgICAgICB8fCAgICAgICBfLi0nICAgICBgLS0tJyAgICAgRiAgKSBgLiBgLiAgICB8CiAgICAgICAgICAgfHwgICBfLi0nICAgICAgICAgICAgICAgICAgLy0nL3wgICBgLiBgLiAgfAogICAgICAgICAgIHx8Li0nICAgICAgICAgICAgICAgICAgICAuX18uJyAgICAgICBgLiBgLnwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgLiB8CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgfAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgLgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAuCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgLgo")+"</pre>");
});
app.get("/get-swap-interval", (_req, res) => {
	res.send(process.env.SWAP_INTERVAL);
});
app.get("/last-swap", (_req, res) => {
	res.send(lastSwapTime.toString());
})
app.post("/check-auth", (req, res) => {
	if (req.body.auth == process.env.AUTH_KEY) {
		res.send({ success: true });
	} else {
		res.status(403).send({ success: false });
	}
});
app.get("/get-event-count", (_req, res) => {
	res.send(clients.length.toString());
});


interface PortalConnection {
	socket: Socket;
	city: string;
	id: string;
	streamID: string;
}

// socket.io stuff
const clients: PortalConnection[] = [];

io.on("connection", socket => {
	if (socket.handshake.auth.authToken !== process.env.AUTH_KEY) {
		socket.disconnect();
		return;
	}

	const portalClient: PortalConnection = {
		socket: socket,
		city: socket.handshake.auth.city,
		id: socket.id,
		streamID: Math.random().toString(36).substring(2, 15),
	};

	// prevent multiple connections from the same city
	if (clients.find(c => c.city == portalClient.city)) {
		console.log("Duplicate connection from", portalClient.city);
		socket.emit("disconnect", "Another connection from the same city is already active.");
		socket.disconnect(true);
		return;
	}

	console.log(`Connection:    ${portalClient.id} ( ${portalClient.city} )`);
	clients.push(portalClient);

	// send the client its streamID
	socket.emit("setup", portalClient.streamID);


	if (clients.length == 2) {
		const [caller, receiver] = clients;
		console.log(`Making ${caller.id} call ${receiver.id}`);
		caller.socket.emit("call", { target: receiver.id, targetCity: receiver.city });
		receiver.socket.emit("assign", { target: caller.id, targetCity: caller.city });
	}

	// handlers
	socket.on("disconnect", () => {
		console.log(`Disconnection: ${portalClient.id} ( ${portalClient.city} )`);
		clients.splice(clients.indexOf(portalClient), 1);
	});
});

// Start the server
httpServer.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
