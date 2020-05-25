import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import { Container, Button, Row, Col } from "react-bootstrap";

function TweetForm() {
  const [username, setUsername] = useState(0);

  useEffect(() => {
    async function fetchData() {
      // You can await here
      const result = await axios.post("/api/test_post");
      // ...
      console.log(result.data);
      setUsername(result.data);
    }
    const result = fetchData();
  }, []); // Or [] if effect doesn't need props or state

  return <div>{username}</div>;
}

function App() {
  return (
    <Container>
      <Row>
        <Col xs={3}>COL1</Col>
        <Col xs={9}>
          <TweetForm></TweetForm>
          <Row>
            <Col xs={8}>COL3</Col>
            <Col xs={4}>COL4</Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
